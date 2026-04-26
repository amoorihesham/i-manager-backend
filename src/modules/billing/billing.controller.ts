import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Database } from '@/db/connection.js';
import type { Env } from '@/config/env.js';
import { STATUS_CODES } from '@/config/constants.js';
import { _sendSuccessResponse } from '@/utils/http.js';
import { BadRequestError, UnauthorizedError } from '@/utils/http-error.js';
import { billingService } from './billing.service.js';
import type { CheckoutInput } from './schemas/index.js';
import type { Stripe } from 'stripe';

interface BillingController {
  createCheckoutSession: (request: FastifyRequest<{ Body: CheckoutInput }>, reply: FastifyReply) => Promise<void>;
  createPortalSession: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  getMyPlan: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  webhook: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

export const billingController = (db: Database, config: Env): BillingController => {
  const service = billingService(db, config);

  return {
    createCheckoutSession: async (request: FastifyRequest<{ Body: CheckoutInput }>, reply: FastifyReply) => {
      const { url } = await service.startCheckout({ userId: request.user.id, tier: request.body.tier });
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Checkout session created', { url }));
    },

    createPortalSession: async (request: FastifyRequest, reply: FastifyReply) => {
      const { url } = await service.startPortal(request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Portal session created', { url }));
    },

    getMyPlan: async (request: FastifyRequest, reply: FastifyReply) => {
      const plan = await service.getUserPlan(request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Current plan', plan));
    },

    webhook: async (request: FastifyRequest, reply: FastifyReply) => {
      const {
        headers: { 'stripe-signature': signature },
        body,
      } = request;
      if (typeof signature !== 'string') {
        throw new UnauthorizedError('Missing stripe-signature header');
      }
      if (!Buffer.isBuffer(body)) {
        throw new BadRequestError('Webhook body must be a buffer');
      }

      let event: Stripe.Event;
      try {
        event = service.constructWebhookEvent(body, signature);
      } catch (err) {
        request.log.warn({ err }, 'Stripe webhook signature verification failed');
        throw new BadRequestError('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
      }

      await service.handleWebhookEvent(event);
      reply.status(STATUS_CODES.OK).send({ received: true });
    },
  };
};
