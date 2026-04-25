import z from 'zod';
import { loginSchema, registerSchema } from '../schemas/index.js';
import { InferInsertModel } from 'drizzle-orm';
import { usersTable } from '@/db/schemas/user.js';
import { JwtPayload } from 'jsonwebtoken';

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type RegisterFunctionReturnType = Omit<InferInsertModel<typeof usersTable>, 'password'>;

export type LoginFunctionReturnType = RegisterFunctionReturnType & { accessToken: string; refreshToken: string };

export type jwtPayloadType = JwtPayload & RegisterFunctionReturnType;
