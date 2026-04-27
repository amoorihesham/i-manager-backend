import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyEnvSchema } from './config/env.js';
import { createDatabaseConnection } from './db/connection.js';
import errorHandler from './utils/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { workspacesRoutes } from './modules/workspaces/workspaces.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import { invitationsRoutes } from './modules/invitations/invitations.routes.js';

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
  await app.register(import('@fastify/cors'), {
    credentials: true,
    origin: app.config.APP_FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });
  await app.register(import('@fastify/cookie'));
  await app.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'i-Manager API',
        description: 'API Documentation',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          apiKeyAuth: {
            type: 'apiKey',
            name: 'accessToken',
            in: 'header',
          },
        },
      },
    },
  });

  createDatabaseConnection({ connectionString: app.config.DATABASE_URL, max: app.config.DATABASE_POOL_SIZE });

  app.setErrorHandler(errorHandler);

  app.register(
    async (fastify) => {
      fastify.get('/health', () => ({ ok: true }));
      await fastify.register(authRoutes, { prefix: '/auth' });
      await fastify.register(billingRoutes, { prefix: '/billing' });
      await fastify.register(workspacesRoutes, { prefix: '/workspaces' });
      await fastify.register(projectsRoutes);
      await fastify.register(tasksRoutes);
      await fastify.register(invitationsRoutes, { prefix: '/invitations' });
    },
    { prefix: 'api/v1' }
  );
  await app.ready();
  app.swagger();
  return await app;
};
