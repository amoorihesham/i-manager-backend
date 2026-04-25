import type { Database } from '@/db/connection.js';
import type { LoginFunctionReturnType, LoginInput, RegisterFunctionReturnType, RegisterInput } from './types/index.js';
import { eq } from 'drizzle-orm';
import { usersTable } from '@/db/schemas/user.js';
import { _comparePassword, _hashPassword } from './utils/hashing.js';
import { _generateJwtToken } from './utils/jwt.js';
import { env } from '@/config/env.js';

type AuthService = {
  register: (payload: RegisterInput) => Promise<RegisterFunctionReturnType>;
  login: (payload: LoginInput) => Promise<LoginFunctionReturnType>;
};

export const authService = (db: Database): AuthService => ({
  register: async ({ username, email, password }) => {
    const exist = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
    if (exist) throw new Error('user already exist');

    const hasedPassword = await _hashPassword(password);
    const [created] = await db.insert(usersTable).values({ username, email, password: hasedPassword }).returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
      role: usersTable.role,
      updatedAt: usersTable.updatedAt,
    });

    return created;
  },
  login: async ({ email, password }) => {
    const exist = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
    if (!exist) throw new Error('user does not exist');

    const isPasswordMatch = await _comparePassword(password, exist.password);
    if (!isPasswordMatch) throw new Error('invalid credentials');

    const { password: _, ...created } = exist;
    const accessToken = _generateJwtToken(created, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_TOKEN_TTL });
    const refreshToken = _generateJwtToken(created, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_TOKEN_TTL });

    return { accessToken, refreshToken, ...created };
  },
});
