import { and, eq } from 'drizzle-orm';
import type { Database } from '@/db/connection.js';
import { usersTable } from '@/db/schemas/user.js';
import { workspaceMembersTable } from '@/db/schemas/workspace-member.js';
import { workspacesTable } from '@/db/schemas/workspace.js';
import { planLimits } from '@/modules/billing/plan-limits.guard.js';
import { ConflictError } from '@/utils/http-error.js';
import { assertWorkspaceRole, loadWorkspaceMembership, loadWorkspaceOrThrow } from './workspaces.guards.js';
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from './schemas/index.js';

export const workspacesService = (
  db: Database
): {
  create: (userId: string, input: CreateWorkspaceInput) => Promise<typeof workspacesTable.$inferSelect>;
  listForUser: (
    userId: string
  ) => Promise<
    Array<{ id: string; name: string; ownerId: string; role: 'owner' | 'admin' | 'member'; createdAt: Date }>
  >;
  getById: (workspaceId: string, userId: string) => Promise<typeof workspacesTable.$inferSelect>;
  update: (
    workspaceId: string,
    userId: string,
    input: UpdateWorkspaceInput
  ) => Promise<typeof workspacesTable.$inferSelect>;
  remove: (workspaceId: string, userId: string) => Promise<void>;
  listMembers: (
    workspaceId: string,
    userId: string
  ) => Promise<
    Array<{ userId: string; role: 'owner' | 'admin' | 'member'; joinedAt: Date; username: string; email: string }>
  >;
  removeMember: (workspaceId: string, requesterId: string, targetUserId: string) => Promise<void>;
} => ({
  create: async (userId: string, input: CreateWorkspaceInput) => {
    await planLimits(db).assertCanCreateWorkspace(userId);

    return await db.transaction(async (tx) => {
      const [workspace] = await tx.insert(workspacesTable).values({ name: input.name, ownerId: userId }).returning();

      await tx.insert(workspaceMembersTable).values({
        workspaceId: workspace.id,
        userId,
        role: 'owner',
      });

      return workspace;
    });
  },

  listForUser: async (userId: string) => {
    const rows = await db
      .select({
        id: workspacesTable.id,
        name: workspacesTable.name,
        ownerId: workspacesTable.ownerId,
        role: workspaceMembersTable.role,
        createdAt: workspacesTable.createdAt,
      })
      .from(workspaceMembersTable)
      .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
      .where(eq(workspaceMembersTable.userId, userId));
    return rows;
  },

  getById: async (workspaceId: string, userId: string) => {
    await loadWorkspaceMembership(db, workspaceId, userId);
    return await loadWorkspaceOrThrow(db, workspaceId);
  },

  update: async (workspaceId: string, userId: string, input: UpdateWorkspaceInput) => {
    await assertWorkspaceRole(db, workspaceId, userId, ['owner', 'admin']);
    const [updated] = await db
      .update(workspacesTable)
      .set({ name: input.name, updatedAt: new Date() })
      .where(eq(workspacesTable.id, workspaceId))
      .returning();
    return updated;
  },

  remove: async (workspaceId: string, userId: string) => {
    await assertWorkspaceRole(db, workspaceId, userId, ['owner']);
    await db.delete(workspacesTable).where(eq(workspacesTable.id, workspaceId));
  },

  listMembers: async (workspaceId: string, userId: string) => {
    await loadWorkspaceMembership(db, workspaceId, userId);
    return await db
      .select({
        userId: workspaceMembersTable.userId,
        role: workspaceMembersTable.role,
        joinedAt: workspaceMembersTable.joinedAt,
        username: usersTable.username,
        email: usersTable.email,
      })
      .from(workspaceMembersTable)
      .innerJoin(usersTable, eq(workspaceMembersTable.userId, usersTable.id))
      .where(eq(workspaceMembersTable.workspaceId, workspaceId));
  },

  removeMember: async (workspaceId: string, requesterId: string, targetUserId: string) => {
    await assertWorkspaceRole(db, workspaceId, requesterId, ['owner', 'admin']);
    const ws = await loadWorkspaceOrThrow(db, workspaceId);
    if (ws.ownerId === targetUserId) {
      throw new ConflictError('Cannot remove the workspace owner', 'CANNOT_REMOVE_OWNER');
    }
    await db
      .delete(workspaceMembersTable)
      .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, targetUserId)));
  },
});
