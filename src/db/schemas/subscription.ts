import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { usersTable } from './user.js';

const VARCHAR_DEFAULT_LENGTH = 255;

export const planTierEnum = pgEnum('plan_tier', ['free', 'pro', 'ultra']);

export const subscriptionsTable = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  tier: planTierEnum('tier').notNull().default('free'),
  status: varchar('status', { length: VARCHAR_DEFAULT_LENGTH }).notNull().default('active'),
  stripeCustomerId: varchar('stripe_customer_id', { length: VARCHAR_DEFAULT_LENGTH }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: VARCHAR_DEFAULT_LENGTH }),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
