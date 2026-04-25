import { pgEnum, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

const VARCHAR_DEFAULT_LENGTH = 255;

export const roleEnum = pgEnum('role', ['user', 'admin']);

export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: VARCHAR_DEFAULT_LENGTH }).notNull(),
  email: varchar('email', { length: VARCHAR_DEFAULT_LENGTH }).notNull().unique(),
  password: varchar('password', { length: VARCHAR_DEFAULT_LENGTH }).notNull(),
  avatar: varchar('avatar', { length: VARCHAR_DEFAULT_LENGTH }),
  role: roleEnum('role').notNull().default('user'),
});
