import z from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerJsonSchema = z.toJSONSchema(registerSchema, { target: 'draft-07' });
export const loginJsonSchema = z.toJSONSchema(loginSchema, { target: 'draft-07' });
