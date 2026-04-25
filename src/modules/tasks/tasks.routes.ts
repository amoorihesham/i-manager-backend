import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@/db/connection.js';
import { tasksController } from './tasks.controller.js';
import { createTaskJsonSchema, updateTaskJsonSchema } from './schemas/index.js';
import { authenticate } from '@/plugins/authenticate.js';

export const tasksRoutes = (fastify: FastifyInstance): void => {
  const controller = tasksController(getDatabase());
  fastify.addHook('preHandler', authenticate);

  fastify.post('/projects/:projectId/tasks', { schema: { body: createTaskJsonSchema } }, controller.create);
  fastify.get('/projects/:projectId/tasks', controller.listInProject);

  fastify.get('/tasks/:id', controller.getById);
  fastify.patch('/tasks/:id', { schema: { body: updateTaskJsonSchema } }, controller.update);
  fastify.delete('/tasks/:id', controller.remove);
};
