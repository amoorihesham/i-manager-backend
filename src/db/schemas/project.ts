import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usersTable } from './user.js';
import { workspacesTable } from './workspace.js';

const VARCHAR_DEFAULT_LENGTH = 255;

export const projectsTable = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspacesTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: VARCHAR_DEFAULT_LENGTH }).notNull(),
  description: text('description'),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
