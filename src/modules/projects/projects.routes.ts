import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@/db/connection.js';
import { projectsController } from './projects.controller.js';
import { createProjectJsonSchema, inviteToProjectJsonSchema, updateProjectJsonSchema } from './schemas/index.js';
import { authenticate } from '@/plugins/authenticate.js';

export const projectsRoutes = (fastify: FastifyInstance): void => {
  const controller = projectsController(getDatabase(), fastify.config);
  fastify.addHook('preHandler', authenticate);

  fastify.post('/workspaces/:workspaceId/projects', { schema: { body: createProjectJsonSchema } }, controller.create);
  fastify.get('/workspaces/:workspaceId/projects', controller.listInWorkspace);

  fastify.get('/projects/:id', controller.getById);
  fastify.patch('/projects/:id', { schema: { body: updateProjectJsonSchema } }, controller.update);
  fastify.delete('/projects/:id', controller.remove);

  fastify.get('/projects/:id/members', controller.listMembers);
  fastify.post('/projects/:id/invitations', { schema: { body: inviteToProjectJsonSchema } }, controller.invite);
};
