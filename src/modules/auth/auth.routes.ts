import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { getDatabase } from '@/db/connection.js';

export const authRoutes = (fastify: FastifyInstance): void => {
  const controller = authController(getDatabase());

  fastify.post('/register', {}, controller.register);
  fastify.post('/login', {}, controller.login);
};
