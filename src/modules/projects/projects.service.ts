import { and, eq } from 'drizzle-orm';
import type { Database } from '@/db/connection.js';
import { projectMembersTable } from '@/db/schemas/project-member.js';
import { projectsTable } from '@/db/schemas/project.js';
import { usersTable } from '@/db/schemas/user.js';
import { workspaceMembersTable } from '@/db/schemas/workspace-member.js';
import { planLimits } from '@/modules/billing/plan-limits.guard.js';
import { ForbiddenError } from '@/utils/http-error.js';
import { loadWorkspaceMembership, loadWorkspaceOrThrow } from '@/modules/workspaces/workspaces.guards.js';
import { assertProjectRole, loadProjectMembership, loadProjectOrThrow } from './projects.guards.js';
import type { CreateProjectInput, UpdateProjectInput } from './schemas/index.js';

export const projectsService = (db: Database) => ({
  create: async (workspaceId: string, userId: string, input: CreateProjectInput) => {
    await loadWorkspaceMembership(db, workspaceId, userId);
    const ws = await loadWorkspaceOrThrow(db, workspaceId);
    await planLimits(db).assertCanCreateProject(ws.ownerId, workspaceId);

    return await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projectsTable)
        .values({ workspaceId, name: input.name, description: input.description, createdById: userId })
        .returning();

      await tx.insert(projectMembersTable).values({
        projectId: project.id,
        userId,
        role: 'admin',
      });

      return project;
    });
  },

  listInWorkspace: async (workspaceId: string, userId: string) => {
    await loadWorkspaceMembership(db, workspaceId, userId);
    return await db.select().from(projectsTable).where(eq(projectsTable.workspaceId, workspaceId));
  },

  getById: async (projectId: string, userId: string) => {
    const project = await loadProjectOrThrow(db, projectId);
    const projMember = await db.query.projectMembersTable.findFirst({
      where: and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId)),
    });
    if (projMember === undefined) {
      const ws = await loadWorkspaceOrThrow(db, project.workspaceId);
      if (ws.ownerId !== userId) throw new ForbiddenError('Not a project member');
    }
    return project;
  },

  update: async (projectId: string, userId: string, input: UpdateProjectInput) => {
    await assertProjectRole(db, projectId, userId, ['admin']);
    const [updated] = await db
      .update(projectsTable)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        updatedAt: new Date(),
      })
      .where(eq(projectsTable.id, projectId))
      .returning();

    return updated;
  },

  remove: async (projectId: string, userId: string) => {
    const project = await loadProjectOrThrow(db, projectId);
    const ws = await loadWorkspaceOrThrow(db, project.workspaceId);

    const projMember = await db.query.projectMembersTable.findFirst({
      where: and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId)),
    });
    const isProjectAdmin = projMember?.role === 'admin';
    const isWorkspaceOwner = ws.ownerId === userId;
    if (!isProjectAdmin && !isWorkspaceOwner) {
      throw new ForbiddenError('Only project admins or the workspace owner can delete a project');
    }

    await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  },

  listMembers: async (projectId: string, userId: string) => {
    await loadProjectMembership(db, projectId, userId);
    return await db
      .select({
        userId: projectMembersTable.userId,
        role: projectMembersTable.role,
        joinedAt: projectMembersTable.joinedAt,
        username: usersTable.username,
        email: usersTable.email,
      })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(projectMembersTable.userId, usersTable.id))
      .where(eq(projectMembersTable.projectId, projectId));
  },

  assertInviteeIsWorkspaceMember: async (workspaceId: string, email: string): Promise<void> => {
    const row = await db
      .select({ userId: workspaceMembersTable.userId })
      .from(workspaceMembersTable)
      .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
      .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(usersTable.email, email)))
      .limit(1);
    if (row.length === 0) {
      throw new ForbiddenError('Project invitee must already be a workspace member');
    }
  },
});
