import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { projectsTable } from './project.js';
import { usersTable } from './user.js';
import { workspacesTable } from './workspace.js';

const VARCHAR_DEFAULT_LENGTH = 255;

export const invitationScopeEnum = pgEnum('invitation_scope', ['workspace', 'project']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'revoked', 'expired']);

export const invitationsTable = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: varchar('token', { length: VARCHAR_DEFAULT_LENGTH }).notNull().unique(),
  email: varchar('email', { length: VARCHAR_DEFAULT_LENGTH }).notNull(),
  scope: invitationScopeEnum('scope').notNull(),
  workspaceId: uuid('workspace_id').references(() => workspacesTable.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projectsTable.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: VARCHAR_DEFAULT_LENGTH }).notNull(),
  invitedById: uuid('invited_by_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  status: invitationStatusEnum('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
