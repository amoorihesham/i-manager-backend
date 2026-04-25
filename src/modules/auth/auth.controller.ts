import type { Database } from '@/db/connection.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from './auth.service.js';

export const authController = (db: Database) => {
  const service = authService(db);

  return {
    register: async (_request: FastifyRequest, reply: FastifyReply) => {
      await service.register();
      reply.send({ ok: true });
    },
    login: async (_request: FastifyRequest, reply: FastifyReply) => {
      await service.login();
      reply.send({ ok: true });
    },
  };
};
