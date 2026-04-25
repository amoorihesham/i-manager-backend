import type { Env } from '@/config/env.js';

export const PLAN_TIERS = ['free', 'pro', 'ultra'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export interface PlanLimits {
  maxWorkspacesPerUser: number;
  maxMembersPerWorkspace: number;
  maxProjectsPerWorkspace: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { maxWorkspacesPerUser: 1, maxMembersPerWorkspace: 3, maxProjectsPerWorkspace: 2 },
  pro: { maxWorkspacesPerUser: 5, maxMembersPerWorkspace: 15, maxProjectsPerWorkspace: 20 },
  ultra: {
    maxWorkspacesPerUser: Number.POSITIVE_INFINITY,
    maxMembersPerWorkspace: Number.POSITIVE_INFINITY,
    maxProjectsPerWorkspace: Number.POSITIVE_INFINITY,
  },
};

export const stripePriceIdToTier = (config: Env): Record<string, Exclude<PlanTier, 'free'>> => ({
  [config.STRIPE_PRICE_ID_PRO]: 'pro',
  [config.STRIPE_PRICE_ID_ULTRA]: 'ultra',
});

export const tierToStripePriceId = (config: Env, tier: Exclude<PlanTier, 'free'>): string => {
  if (tier === 'pro') return config.STRIPE_PRICE_ID_PRO;
  return config.STRIPE_PRICE_ID_ULTRA;
};
