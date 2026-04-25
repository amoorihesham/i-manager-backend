import type { Database } from '@/db/connection.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from './auth.service.js';
import { LoginInput, RegisterInput } from './types/index.js';
import { STATUS_CODES } from '@/config/constants.js';
import { _sendSuccessResponse } from '@/utils/http.js';

export const authController = (db: Database) => {
  const service = authService(db);

  return {
    register: async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      const {
        body: { username, email, password },
      } = request;
      const { ...rest } = await service.register({ username, email, password });
      reply.status(STATUS_CODES.CREATED).send(_sendSuccessResponse('User registered successfully!', { ...rest }));
    },
    login: async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      const {
        body: { email, password },
      } = request;
      const { ...rest } = await service.login({ email, password });
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('User logged in successfully!', { ...rest }));
    },
  };
};
