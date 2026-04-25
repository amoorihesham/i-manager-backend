import type { Database } from '@/db/connection.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from './auth.service.js';
import type { LoginInput, RegisterInput } from './types/index.js';
import { STATUS_CODES } from '@/config/constants.js';
import { _sendSuccessResponse } from '@/utils/http.js';
import type { Env } from '@/config/env.js';

interface AuthController {
  register: (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => Promise<void>;
  login: (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => Promise<void>;
}

export const authController = (db: Database, config: Env): AuthController => {
  const service = authService(db, config);

  const setAuthCookies = (reply: FastifyReply, accessToken: string, refreshToken: string, isProd: boolean): void => {
    const cookieBase = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
    };
    reply.setCookie('accessToken', accessToken, {
      ...cookieBase,
      maxAge: Math.floor(config.JWT_ACCESS_TOKEN_TTL / 1000),
    });
    reply.setCookie('refreshToken', refreshToken, {
      ...cookieBase,
      maxAge: Math.floor(config.JWT_REFRESH_TOKEN_TTL / 1000),
    });
  };

  return {
    register: async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      const {
        body: { username, email, password },
      } = request;
      const created = await service.register({ username, email, password });
      reply.status(STATUS_CODES.CREATED).send(_sendSuccessResponse('User registered successfully!', created));
    },
    login: async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      const {
        body: { email, password },
      } = request;
      const { accessToken, refreshToken, ...user } = await service.login({ email, password });
      setAuthCookies(reply, accessToken, refreshToken, config.NODE_ENV === 'production');
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('User logged in successfully!', user));
    },
  };
};
