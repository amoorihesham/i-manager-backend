import { randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { Database } from '@/db/connection.js';
import type { Env } from '@/config/env.js';
import { invitationsTable } from '@/db/schemas/invitation.js';
import { projectMembersTable } from '@/db/schemas/project-member.js';
import { projectsTable } from '@/db/schemas/project.js';
import { usersTable } from '@/db/schemas/user.js';
import { workspaceMembersTable } from '@/db/schemas/workspace-member.js';
import { workspacesTable } from '@/db/schemas/workspace.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/utils/http-error.js';
import { sendInvitationEmail } from '@/utils/email.js';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const generateToken = (): string => randomBytes(32).toString('hex');

const lower = (column: typeof usersTable.email | typeof invitationsTable.email) => sql`lower(${column})`;

const resolveResourceName = async (
  db: Database,
  scope: string,
  workspaceId: string | null,
  projectId: string | null
): Promise<string> => {
  if (scope === 'workspace' && workspaceId !== null) {
    const ws = await db.query.workspacesTable.findFirst({ where: eq(workspacesTable.id, workspaceId) });
    return ws?.name ?? '';
  }
  if (scope === 'project' && projectId !== null) {
    const p = await db.query.projectsTable.findFirst({ where: eq(projectsTable.id, projectId) });
    return p?.name ?? '';
  }
  return '';
};

const assertRevokePermission = async (
  db: Database,
  scope: string,
  workspaceId: string | null,
  projectId: string | null,
  requesterId: string
): Promise<void> => {
  if (scope === 'workspace' && workspaceId !== null) {
    const membership = await db.query.workspaceMembersTable.findFirst({
      where: and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, requesterId)),
    });
    if (membership === undefined || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new ForbiddenError('Not allowed to revoke this invitation');
    }
    return;
  }
  if (scope === 'project' && projectId !== null) {
    const membership = await db.query.projectMembersTable.findFirst({
      where: and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, requesterId)),
    });
    if (membership?.role !== 'admin') {
      throw new ForbiddenError('Not allowed to revoke this invitation');
    }
  }
};

type MemberRole = 'admin' | 'member';

const toMemberRole = (role: string): MemberRole => (role === 'admin' ? 'admin' : 'member');

export const invitationsService = (
  db: Database,
  config: Env
): {
  createWorkspaceInvitation: (params: {
    workspaceId: string;
    email: string;
    role: MemberRole;
    invitedById: string;
  }) => Promise<typeof invitationsTable.$inferSelect>;
  createProjectInvitation: (params: {
    projectId: string;
    workspaceId: string;
    email: string;
    role: MemberRole;
    invitedById: string;
  }) => Promise<typeof invitationsTable.$inferSelect>;
  preview: (token: string) => Promise<{
    scope: string;
    role: string;
    resourceName: string;
    inviterUsername: string | null;
    email: string;
    status: string;
    expiresAt: Date;
  }>;
  accept: (params: {
    token: string;
    userId: string;
    userEmail: string;
  }) => Promise<typeof invitationsTable.$inferSelect>;
  revoke: (invitationId: string, requesterId: string) => Promise<void>;
} => ({
  createWorkspaceInvitation: async (params: {
    workspaceId: string;
    email: string;
    role: MemberRole;
    invitedById: string;
  }) => {
    const workspace = await db.query.workspacesTable.findFirst({
      where: eq(workspacesTable.id, params.workspaceId),
    });
    if (workspace === undefined) throw new NotFoundError('Workspace not found');

    const existingMember = await db
      .select({ id: workspaceMembersTable.id })
      .from(workspaceMembersTable)
      .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, params.workspaceId),
          sql`${lower(usersTable.email)} = ${params.email.toLowerCase()}`
        )
      )
      .limit(1);
    if (existingMember.length > 0) throw new ConflictError('User is already a workspace member');

    const existingPending = await db.query.invitationsTable.findFirst({
      where: and(
        eq(invitationsTable.workspaceId, params.workspaceId),
        eq(invitationsTable.scope, 'workspace'),
        eq(invitationsTable.status, 'pending'),
        sql`${lower(invitationsTable.email)} = ${params.email.toLowerCase()}`
      ),
    });
    if (existingPending !== undefined) throw new ConflictError('A pending invitation already exists for this email');

    const inviter = await db.query.usersTable.findFirst({ where: eq(usersTable.id, params.invitedById) });

    const token = generateToken();
    const [invitation] = await db
      .insert(invitationsTable)
      .values({
        token,
        email: params.email.toLowerCase(),
        scope: 'workspace',
        workspaceId: params.workspaceId,
        role: params.role,
        invitedById: params.invitedById,
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      })
      .returning();

    await sendInvitationEmail(config, {
      to: params.email,
      inviterName: inviter?.username ?? 'Someone',
      resourceName: workspace.name,
      scope: 'workspace',
      token,
    }).catch((err: unknown) => {
      // Email failures are logged but do not roll back the invite — the link can be re-sent.
      console.error('Failed to send invitation email', err);
    });

    return invitation;
  },

  createProjectInvitation: async (params: {
    projectId: string;
    workspaceId: string;
    email: string;
    role: 'admin' | 'member';
    invitedById: string;
  }) => {
    const project = await db.query.projectsTable.findFirst({ where: eq(projectsTable.id, params.projectId) });
    if (project === undefined) throw new NotFoundError('Project not found');

    const existingMember = await db
      .select({ id: projectMembersTable.id })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(projectMembersTable.userId, usersTable.id))
      .where(
        and(
          eq(projectMembersTable.projectId, params.projectId),
          sql`${lower(usersTable.email)} = ${params.email.toLowerCase()}`
        )
      )
      .limit(1);
    if (existingMember.length > 0) throw new ConflictError('User is already a project member');

    const existingPending = await db.query.invitationsTable.findFirst({
      where: and(
        eq(invitationsTable.projectId, params.projectId),
        eq(invitationsTable.scope, 'project'),
        eq(invitationsTable.status, 'pending'),
        sql`${lower(invitationsTable.email)} = ${params.email.toLowerCase()}`
      ),
    });
    if (existingPending !== undefined) throw new ConflictError('A pending invitation already exists for this email');

    const inviter = await db.query.usersTable.findFirst({ where: eq(usersTable.id, params.invitedById) });

    const token = generateToken();
    const [invitation] = await db
      .insert(invitationsTable)
      .values({
        token,
        email: params.email.toLowerCase(),
        scope: 'project',
        workspaceId: params.workspaceId,
        projectId: params.projectId,
        role: params.role,
        invitedById: params.invitedById,
        expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
      })
      .returning();

    await sendInvitationEmail(config, {
      to: params.email,
      inviterName: inviter?.username ?? 'Someone',
      resourceName: project.name,
      scope: 'project',
      token,
    }).catch((err: unknown) => {
      console.error('Failed to send invitation email', err);
    });

    return invitation;
  },

  preview: async (token: string) => {
    const inv = await db.query.invitationsTable.findFirst({ where: eq(invitationsTable.token, token) });
    if (inv === undefined) throw new NotFoundError('Invitation not found');
    const [inviter, resourceName] = await Promise.all([
      db.query.usersTable.findFirst({ where: eq(usersTable.id, inv.invitedById) }),
      resolveResourceName(db, inv.scope, inv.workspaceId, inv.projectId),
    ]);

    return {
      scope: inv.scope,
      role: inv.role,
      resourceName,
      inviterUsername: inviter?.username ?? null,
      email: inv.email,
      status: inv.status,
      expiresAt: inv.expiresAt,
    };
  },

  accept: async (params: { token: string; userId: string; userEmail: string }) => {
    const inv = await db.query.invitationsTable.findFirst({ where: eq(invitationsTable.token, params.token) });
    if (inv === undefined) throw new NotFoundError('Invitation not found');
    if (inv.status !== 'pending')
      throw new BadRequestError('Invitation is no longer pending', 'INVITATION_NOT_PENDING');
    if (inv.expiresAt.getTime() < Date.now()) {
      await db.update(invitationsTable).set({ status: 'expired' }).where(eq(invitationsTable.id, inv.id));
      throw new BadRequestError('Invitation has expired', 'INVITATION_EXPIRED');
    }
    if (inv.email.toLowerCase() !== params.userEmail.toLowerCase()) {
      throw new ForbiddenError('Invitation email does not match your account');
    }

    return await db.transaction(async (tx) => {
      if (inv.scope === 'workspace' && inv.workspaceId !== null) {
        await tx
          .insert(workspaceMembersTable)
          .values({
            workspaceId: inv.workspaceId,
            userId: params.userId,
            role: toMemberRole(inv.role),
          })
          .onConflictDoNothing();
      } else if (inv.scope === 'project' && inv.projectId !== null && inv.workspaceId !== null) {
        await tx
          .insert(workspaceMembersTable)
          .values({ workspaceId: inv.workspaceId, userId: params.userId, role: 'member' })
          .onConflictDoNothing();
        await tx
          .insert(projectMembersTable)
          .values({
            projectId: inv.projectId,
            userId: params.userId,
            role: toMemberRole(inv.role),
          })
          .onConflictDoNothing();
      }

      const [updated] = await tx
        .update(invitationsTable)
        .set({ status: 'accepted', acceptedAt: new Date() })
        .where(eq(invitationsTable.id, inv.id))
        .returning();
      return updated;
    });
  },

  revoke: async (invitationId: string, requesterId: string) => {
    const inv = await db.query.invitationsTable.findFirst({ where: eq(invitationsTable.id, invitationId) });
    if (inv === undefined) throw new NotFoundError('Invitation not found');
    if (inv.status !== 'pending') throw new BadRequestError('Invitation is no longer pending');

    if (inv.invitedById !== requesterId) {
      await assertRevokePermission(db, inv.scope, inv.workspaceId, inv.projectId, requesterId);
    }

    await db.update(invitationsTable).set({ status: 'revoked' }).where(eq(invitationsTable.id, invitationId));
  },
});
