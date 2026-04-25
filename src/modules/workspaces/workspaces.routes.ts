import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@/db/connection.js';
import { workspacesController } from './workspaces.controller.js';
import { createWorkspaceJsonSchema, inviteToWorkspaceJsonSchema, updateWorkspaceJsonSchema } from './schemas/index.js';
import { authenticate } from '@/plugins/authenticate.js';

export const workspacesRoutes = (fastify: FastifyInstance): void => {
  const controller = workspacesController(getDatabase(), fastify.config);
  fastify.addHook('preHandler', authenticate);

  fastify.post('/', { schema: { body: createWorkspaceJsonSchema } }, controller.create);
  fastify.get('/', controller.list);
  fastify.get('/:id', controller.getById);
  fastify.patch('/:id', { schema: { body: updateWorkspaceJsonSchema } }, controller.update);
  fastify.delete('/:id', controller.remove);

  fastify.get('/:id/members', controller.listMembers);
  fastify.delete('/:id/members/:userId', controller.removeMember);

  fastify.post('/:id/invitations', { schema: { body: inviteToWorkspaceJsonSchema } }, controller.invite);
};
