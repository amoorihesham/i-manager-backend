import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import type { Database } from '@/db/connection.js';
import type { Env } from '@/config/env.js';
import { subscriptionsTable } from '@/db/schemas/subscription.js';
import { usersTable } from '@/db/schemas/user.js';
import { BadRequestError, NotFoundError } from '@/utils/http-error.js';
import { createStripeAdapter, type StripeAdapter } from './billing.stripe.js';
import { PLAN_TIERS, stripePriceIdToTier, tierToStripePriceId, type PlanTier } from './plans.config.js';

interface StartCheckoutInput {
  userId: string;
  tier: Exclude<PlanTier, 'free'>;
}

export interface BillingService {
  startCheckout: (input: StartCheckoutInput) => Promise<{ url: string }>;
  startPortal: (userId: string) => Promise<{ url: string }>;
  handleWebhookEvent: (event: Stripe.Event) => Promise<void>;
  getUserPlan: (userId: string) => Promise<{ tier: PlanTier; status: string }>;
  constructWebhookEvent: (rawBody: Buffer, signature: string) => Stripe.Event;
}

export const billingService = (
  db: Database,
  config: Env,
  stripe: StripeAdapter = createStripeAdapter(config)
): BillingService => {
  const ensureCustomer = async (userId: string): Promise<{ customerId: string }> => {
    const sub = await db.query.subscriptionsTable.findFirst({ where: eq(subscriptionsTable.userId, userId) });
    if (sub === undefined) throw new NotFoundError('Subscription record missing for user');

    if (sub.stripeCustomerId !== null) return { customerId: sub.stripeCustomerId };

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (user === undefined) throw new NotFoundError('User not found');

    const customer = await stripe.createCustomer({ email: user.email, userId });
    await db
      .update(subscriptionsTable)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(subscriptionsTable.userId, userId));

    return { customerId: customer.id };
  };

  const upsertFromSubscription = async (
    sub: Stripe.Subscription,
    overrides: { status?: string; tier?: PlanTier } = {}
  ): Promise<void> => {
    const userId = typeof sub.metadata.userId === 'string' ? sub.metadata.userId : null;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    const {
      items: {
        data: [
          {
            price: { id: priceId },
          },
        ],
      },
    } = sub;
    const mappedTier = stripePriceIdToTier(config)[priceId];
    const tier: PlanTier = overrides.tier !== undefined ? mappedTier : 'free';
    const status = overrides.status ?? sub.status;
    const { current_period_end: currentPeriodEnd } = sub as unknown as { current_period_end?: number };
    const periodEnd = typeof currentPeriodEnd === 'number' ? new Date(currentPeriodEnd * 1000) : null;

    const target =
      userId !== null ? eq(subscriptionsTable.userId, userId) : eq(subscriptionsTable.stripeCustomerId, customerId);

    await db
      .update(subscriptionsTable)
      .set({
        tier,
        status,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: customerId,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(target);
  };

  return {
    getUserPlan: async (userId) => {
      const sub = await db.query.subscriptionsTable.findFirst({ where: eq(subscriptionsTable.userId, userId) });
      if (sub === undefined) throw new NotFoundError('Subscription record missing for user');
      return { tier: sub.tier, status: sub.status };
    },

    startCheckout: async ({ userId, tier }) => {
      if (!PLAN_TIERS.includes(tier) || tier === 'free') {
        throw new BadRequestError('Invalid tier for checkout', 'INVALID_TIER');
      }
      const { customerId } = await ensureCustomer(userId);
      const priceId = tierToStripePriceId(config, tier);
      const session = await stripe.createCheckoutSession({
        customerId,
        priceId,
        userId,
        successUrl: `${config.APP_FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${config.APP_FRONTEND_URL}/billing/cancel`,
      });
      if (session.url === null) throw new BadRequestError('Failed to create checkout session');
      return { url: session.url };
    },

    startPortal: async (userId) => {
      const { customerId } = await ensureCustomer(userId);
      const session = await stripe.createPortalSession({
        customerId,
        returnUrl: `${config.APP_FRONTEND_URL}/billing`,
      });
      return { url: session.url };
    },

    handleWebhookEvent: async (event) => {
      switch (event.type) {
        case 'checkout.session.completed': {
          const {
            data: {
              object: { subscription },
            },
          } = event;
          if (subscription === null) return;
          const subId = typeof subscription === 'string' ? subscription : subscription.id;
          const sub = await stripe.retrieveSubscription(subId);
          await upsertFromSubscription(sub, { status: 'active' });
          return;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          await upsertFromSubscription(event.data.object);
          return;
        }
        case 'customer.subscription.deleted': {
          await upsertFromSubscription(event.data.object, { tier: 'free', status: 'canceled' });
          return;
        }
        case 'invoice.payment_failed': {
          const {
            data: { object: invoice },
          } = event;
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
          if (customerId === undefined) return;
          await db
            .update(subscriptionsTable)
            .set({ status: 'past_due', updatedAt: new Date() })
            .where(eq(subscriptionsTable.stripeCustomerId, customerId));
          break;
        }
        default:
      }
    },

    constructWebhookEvent: (rawBody, signature) => stripe.constructWebhookEvent(rawBody, signature),
  };
};
