import z from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.number(),
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
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const fastifyEnvSchema = z.toJSONSchema(envSchema, { target: 'draft-07' });
