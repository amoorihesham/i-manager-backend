import { and, count, eq } from 'drizzle-orm';
import type { Database } from '@/db/connection.js';
import { projectsTable } from '@/db/schemas/project.js';
import { workspaceMembersTable } from '@/db/schemas/workspace-member.js';
import { workspacesTable } from '@/db/schemas/workspace.js';
import { PlanLimitExceededError } from '@/utils/http-error.js';
import { PLAN_LIMITS, type PlanTier } from './plans.config.js';
import { subscriptionsTable } from '@/db/schemas/subscription.js';

const tierFor = async (db: Database, userId: string): Promise<PlanTier> => {
  const sub = await db.query.subscriptionsTable.findFirst({ where: eq(subscriptionsTable.userId, userId) });
  return sub?.tier ?? 'free';
};

export const planLimits = (
  db: Database
): {
  assertCanCreateWorkspace: (userId: string) => Promise<void>;
  assertCanInviteMember: (workspaceOwnerId: string, workspaceId: string) => Promise<void>;
  assertCanCreateProject: (workspaceOwnerId: string, workspaceId: string) => Promise<void>;
} => ({
  assertCanCreateWorkspace: async (userId: string): Promise<void> => {
    const tier = await tierFor(db, userId);
    const {
      [tier]: { maxWorkspacesPerUser },
    } = PLAN_LIMITS;
    if (maxWorkspacesPerUser === Number.POSITIVE_INFINITY) return;
    const [{ value }] = await db
      .select({ value: count() })
      .from(workspacesTable)
      .where(eq(workspacesTable.ownerId, userId));
    if (value >= maxWorkspacesPerUser) {
      throw new PlanLimitExceededError(
        `Your ${tier} plan allows up to ${maxWorkspacesPerUser} workspace(s). Upgrade to create more.`
      );
    }
  },

  assertCanInviteMember: async (workspaceOwnerId: string, workspaceId: string): Promise<void> => {
    const tier = await tierFor(db, workspaceOwnerId);
    const {
      [tier]: { maxMembersPerWorkspace },
    } = PLAN_LIMITS;
    if (maxMembersPerWorkspace === Number.POSITIVE_INFINITY) return;
    const [{ value }] = await db
      .select({ value: count() })
      .from(workspaceMembersTable)
      .where(eq(workspaceMembersTable.workspaceId, workspaceId));
    if (value >= maxMembersPerWorkspace) {
      throw new PlanLimitExceededError(
        `The owner's ${tier} plan allows up to ${maxMembersPerWorkspace} member(s) per workspace.`
      );
    }
  },

  assertCanCreateProject: async (workspaceOwnerId: string, workspaceId: string): Promise<void> => {
    const tier = await tierFor(db, workspaceOwnerId);
    const {
      [tier]: { maxProjectsPerWorkspace },
    } = PLAN_LIMITS;
    if (maxProjectsPerWorkspace === Number.POSITIVE_INFINITY) return;
    const [{ value }] = await db
      .select({ value: count() })
      .from(projectsTable)
      .where(and(eq(projectsTable.workspaceId, workspaceId)));
    if (value >= maxProjectsPerWorkspace) {
      throw new PlanLimitExceededError(
        `The owner's ${tier} plan allows up to ${maxProjectsPerWorkspace} project(s) per workspace.`
      );
    }
  },
});
