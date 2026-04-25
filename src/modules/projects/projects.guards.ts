import { and, eq } from 'drizzle-orm';
import type { Database } from '@/db/connection.js';
import { projectMembersTable } from '@/db/schemas/project-member.js';
import { projectsTable } from '@/db/schemas/project.js';
import { ForbiddenError, NotFoundError } from '@/utils/http-error.js';

export type ProjectRole = 'admin' | 'member';

export const loadProjectOrThrow = async (
  db: Database,
  projectId: string
): Promise<{ id: string; workspaceId: string; name: string; createdById: string }> => {
  const p = await db.query.projectsTable.findFirst({ where: eq(projectsTable.id, projectId) });
  if (p === undefined) throw new NotFoundError('Project not found');
  return { id: p.id, workspaceId: p.workspaceId, name: p.name, createdById: p.createdById };
};

export const loadProjectMembership = async (
  db: Database,
  projectId: string,
  userId: string
): Promise<{ role: ProjectRole }> => {
  const row = await db.query.projectMembersTable.findFirst({
    where: and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId)),
  });
  if (row === undefined) throw new ForbiddenError('You are not a member of this project');
  return { role: row.role };
};

export const assertProjectRole = async (
  db: Database,
  projectId: string,
  userId: string,
  allowed: readonly ProjectRole[]
): Promise<void> => {
  const { role } = await loadProjectMembership(db, projectId, userId);
  if (!allowed.includes(role)) {
    throw new ForbiddenError(`Requires project role: ${allowed.join(' | ')}`);
  }
};
