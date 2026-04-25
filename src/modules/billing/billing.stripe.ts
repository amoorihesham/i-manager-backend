import Stripe from 'stripe';
import type { Env } from '@/config/env.js';

export interface StripeAdapter {
  createCustomer: (params: { email: string; userId: string }) => Promise<Stripe.Customer>;
  createCheckoutSession: (params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    userId: string;
  }) => Promise<Stripe.Checkout.Session>;
  createPortalSession: (params: { customerId: string; returnUrl: string }) => Promise<Stripe.BillingPortal.Session>;
  constructWebhookEvent: (rawBody: Buffer, signature: string) => Stripe.Event;
  retrieveSubscription: (subscriptionId: string) => Promise<Stripe.Subscription>;
}

export const createStripeAdapter = (config: Env): StripeAdapter => {
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  return {
    createCustomer: async ({ email, userId }) =>
      await stripe.customers.create({
        email,
        metadata: { userId },
      }),

    createCheckoutSession: async ({ customerId, priceId, successUrl, cancelUrl, userId }) =>
      await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: { userId },
      }),

    createPortalSession: async ({ customerId, returnUrl }) =>
      await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      }),

    constructWebhookEvent: (rawBody, signature) =>
      stripe.webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET),

    retrieveSubscription: async (subscriptionId) => await stripe.subscriptions.retrieve(subscriptionId),
  };
};
