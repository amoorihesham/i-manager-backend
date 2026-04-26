import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { getDatabase } from '@/db/connection.js';
import { loginJsonSchema, registerJsonSchema } from './schemas/index.js';

export const authRoutes = (fastify: FastifyInstance): void => {
  const controller = authController(getDatabase(), fastify.config);

  fastify.post(
    '/register',
    { schema: { tags: ['auth'], summary: 'Register', description: 'Register', body: registerJsonSchema } },
    controller.register
  );
  fastify.post(
    '/login',
    { schema: { tags: ['auth'], summary: 'Login', description: 'Login', body: loginJsonSchema } },
    controller.login
  );
};
