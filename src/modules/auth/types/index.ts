import type z from 'zod';
import type { loginSchema, registerSchema } from '../schemas/index.js';
import type { InferInsertModel } from 'drizzle-orm';
import type { usersTable } from '@/db/schemas/user.js';
import type { JwtPayload } from 'jsonwebtoken';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type RegisterFunctionReturnType = Omit<InferInsertModel<typeof usersTable>, 'password'>;

export type LoginFunctionReturnType = RegisterFunctionReturnType & { accessToken: string; refreshToken: string };

export type jwtPayloadType = JwtPayload & RegisterFunctionReturnType;
