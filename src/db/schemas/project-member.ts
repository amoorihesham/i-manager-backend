import { pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { projectsTable } from './project.js';
import { usersTable } from './user.js';

export const projectRoleEnum = pgEnum('project_role', ['admin', 'member']);

export const projectMembersTable = pgTable(
  'project_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    role: projectRoleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('project_members_project_user_unique').on(table.projectId, table.userId)]
);
