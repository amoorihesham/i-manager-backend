import { and, eq } from 'drizzle-orm';
import type { Database } from '@/db/connection.js';
import { projectMembersTable } from '@/db/schemas/project-member.js';
import { tasksTable } from '@/db/schemas/task.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/utils/http-error.js';
import { assertProjectRole, loadProjectMembership } from '@/modules/projects/projects.guards.js';
import type { CreateTaskInput, UpdateTaskInput } from './schemas/index.js';

const isProjectMember = async (db: Database, projectId: string, userId: string): Promise<boolean> => {
  const row = await db.query.projectMembersTable.findFirst({
    where: and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId)),
  });
  return row !== undefined;
};

const loadTaskOrThrow = async (db: Database, taskId: string) => {
  const task = await db.query.tasksTable.findFirst({ where: eq(tasksTable.id, taskId) });
  if (task === undefined) throw new NotFoundError('Task not found');
  return task;
};

export const tasksService = (db: Database) => ({
  create: async (projectId: string, userId: string, input: CreateTaskInput) => {
    await loadProjectMembership(db, projectId, userId);

    if (input.assigneeId !== undefined) {
      const assigneeIsMember = await isProjectMember(db, projectId, input.assigneeId);
      if (!assigneeIsMember) throw new BadRequestError('Assignee must be a project member', 'INVALID_ASSIGNEE');
    }

    const [task] = await db
      .insert(tasksTable)
      .values({
        projectId,
        title: input.title,
        description: input.description,
        status: input.status,
        assigneeId: input.assigneeId,
        createdById: userId,
      })
      .returning();
    return task;
  },

  listInProject: async (projectId: string, userId: string) => {
    await loadProjectMembership(db, projectId, userId);
    return await db.select().from(tasksTable).where(eq(tasksTable.projectId, projectId));
  },

  getById: async (taskId: string, userId: string) => {
    const task = await loadTaskOrThrow(db, taskId);
    await loadProjectMembership(db, task.projectId, userId);
    return task;
  },

  update: async (taskId: string, userId: string, input: UpdateTaskInput) => {
    const task = await loadTaskOrThrow(db, taskId);
    await loadProjectMembership(db, task.projectId, userId);

    if (input.assigneeId !== undefined) {
      const assigneeIsMember = await isProjectMember(db, task.projectId, input.assigneeId);
      if (!assigneeIsMember) throw new BadRequestError('Assignee must be a project member', 'INVALID_ASSIGNEE');
    }

    const [updated] = await db
      .update(tasksTable)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
        updatedAt: new Date(),
      })
      .where(eq(tasksTable.id, taskId))
      .returning();
    return updated;
  },

  remove: async (taskId: string, userId: string) => {
    const task = await loadTaskOrThrow(db, taskId);
    if (task.createdById === userId) {
      await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
      return;
    }
    try {
      await assertProjectRole(db, task.projectId, userId, ['admin']);
    } catch {
      throw new ForbiddenError('Only the task creator or a project admin can delete this task');
    }
    await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
  },
});
