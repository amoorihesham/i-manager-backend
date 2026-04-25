import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@/db/connection.js';
import { billingController } from './billing.controller.js';
import { checkoutJsonSchema } from './schemas/index.js';
import { authenticate } from '@/plugins/authenticate.js';

export const billingRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const controller = billingController(getDatabase(), fastify.config);
  fastify.addHook('preHandler', authenticate);

  fastify.post('/checkout', { schema: { body: checkoutJsonSchema } }, controller.createCheckoutSession);

  fastify.post('/portal', controller.createPortalSession);

  fastify.get('/me', controller.getMyPlan);

  await fastify.register((scope) => {
    scope.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, body, done) => {
      done(null, body);
    });
    scope.post('/webhook', controller.webhook);
  });
};
