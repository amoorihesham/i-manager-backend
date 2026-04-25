import type { Env } from '@/config/env.ts';

declare module 'fastify' {
  interface FastifyInstance {
    config: Env;
  }

  interface FastifyRequest {
    user: {
      id: string;
      email: string;
    };
  }
}
