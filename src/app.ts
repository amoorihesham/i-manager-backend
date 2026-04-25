import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyEnvSchema } from './config/env.js';
import { createDatabaseConnection } from './db/connection.js';
import errorHandler from './utils/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    },
  });

  await app.register(import('@fastify/env'), { dotenv: true, schema: fastifyEnvSchema });
  await app.register(import('@fastify/cookie'));

  createDatabaseConnection({ connectionString: app.config.DATABASE_URL, max: app.config.DATABASE_POOL_SIZE });

  app.setErrorHandler(errorHandler);

  app.register(
    async (fastify) => {
      fastify.get('/health', () => ({ ok: true }));
      await fastify.register(authRoutes, { prefix: '/auth' });
    },
    { prefix: 'api/v1' }
  );

  return await app;
};
