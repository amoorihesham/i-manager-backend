import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projectsTable } from './project.js';
import { usersTable } from './user.js';

const VARCHAR_DEFAULT_LENGTH = 255;

export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done']);

export const tasksTable = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projectsTable.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: VARCHAR_DEFAULT_LENGTH }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  assigneeId: uuid('assignee_id').references(() => usersTable.id, { onDelete: 'set null' }),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
