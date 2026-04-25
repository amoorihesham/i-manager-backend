import { and, eq } from 'drizzle-orm';
import type { Database } from '@/db/connection.js';
import { workspaceMembersTable } from '@/db/schemas/workspace-member.js';
import { workspacesTable } from '@/db/schemas/workspace.js';
import { ForbiddenError, NotFoundError } from '@/utils/http-error.js';

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export const loadWorkspaceMembership = async (
  db: Database,
  workspaceId: string,
  userId: string
): Promise<{ workspaceId: string; userId: string; role: WorkspaceRole }> => {
  const row = await db.query.workspaceMembersTable.findFirst({
    where: and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.userId, userId)),
  });
  if (row === undefined) throw new ForbiddenError('You are not a member of this workspace');
  return { workspaceId: row.workspaceId, userId: row.userId, role: row.role };
};

export const assertWorkspaceRole = async (
  db: Database,
  workspaceId: string,
  userId: string,
  allowed: readonly WorkspaceRole[]
): Promise<void> => {
  const { role } = await loadWorkspaceMembership(db, workspaceId, userId);
  if (!allowed.includes(role)) {
    throw new ForbiddenError(`Requires role: ${allowed.join(' | ')}`);
  }
};

export const loadWorkspaceOrThrow = async (
  db: Database,
  workspaceId: string
): Promise<{ id: string; name: string; ownerId: string }> => {
  const ws = await db.query.workspacesTable.findFirst({ where: eq(workspacesTable.id, workspaceId) });
  if (ws === undefined) throw new NotFoundError('Workspace not found');
  return { id: ws.id, name: ws.name, ownerId: ws.ownerId };
};
