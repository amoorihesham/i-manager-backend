import { pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './user.js';
import { workspacesTable } from './workspace.js';

export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'admin', 'member']);

export const workspaceMembersTable = pgTable(
  'workspace_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspacesTable.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    role: workspaceRoleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('workspace_members_workspace_user_unique').on(table.workspaceId, table.userId)]
);
