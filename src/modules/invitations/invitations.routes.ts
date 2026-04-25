import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@/db/connection.js';
import { invitationsController } from './invitations.controller.js';
import { authenticate } from '@/plugins/authenticate.js';

export const invitationsRoutes = (fastify: FastifyInstance): void => {
  const controller = invitationsController(getDatabase(), fastify.config);
  fastify.addHook('preHandler', authenticate);

  fastify.get('/:token', controller.preview);
  fastify.post('/:token/accept', controller.accept);
  fastify.post('/:id/revoke', controller.revoke);
};
