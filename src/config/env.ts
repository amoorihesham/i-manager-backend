import z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.number(),
  SERVER_LISTENING_HOST: z.string(),
  DATABASE_URL: z.string(),
  DATABASE_POOL_SIZE: z.number(),
  JWT_SECRET: z.string(),
  JWT_ACCESS_TOKEN_TTL: z.number(),
  JWT_REFRESH_TOKEN_TTL: z.number(),
  SALT_ROUND: z.number(),
  UPSTASH_REDIS_REST_URL: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  SMTP_SERVER: z.string(),
  SMTP_SERVER_PORT: z.number(),
  SMTP_SERVER_USERNAME: z.string(),
  SMTP_SERVER_PASSWORD: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  STRIPE_PRICE_ID_PRO: z.string(),
  STRIPE_PRICE_ID_ULTRA: z.string(),
  APP_FRONTEND_URL: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const fastifyEnvSchema = z.toJSONSchema(envSchema, { target: 'draft-07' });
