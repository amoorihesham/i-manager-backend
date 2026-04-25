import type { Database } from '@/db/connection.js';
import type { LoginFunctionReturnType, LoginInput, RegisterFunctionReturnType, RegisterInput } from './types/index.js';
import { eq } from 'drizzle-orm';
import { usersTable } from '@/db/schemas/user.js';
import { subscriptionsTable } from '@/db/schemas/subscription.js';
import { _comparePassword, _hashPassword } from './utils/hashing.js';
import { _generateJwtToken } from './utils/jwt.js';
import type { Env } from '@/config/env.js';
import { ConflictError, UnauthorizedError } from '@/utils/http-error.js';

interface AuthService {
  register: (payload: RegisterInput) => Promise<RegisterFunctionReturnType>;
  login: (payload: LoginInput) => Promise<LoginFunctionReturnType>;
}

export const authService = (db: Database, config: Env): AuthService => ({
  register: async ({ username, email, password }) => {
    const exist = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
    if (exist !== undefined) throw new ConflictError('User already exists', 'USER_EXISTS');

    const hashedPassword = await _hashPassword(password, config.SALT_ROUND);

    return await db.transaction(async (tx) => {
      const [created] = await tx.insert(usersTable).values({ username, email, password: hashedPassword }).returning({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        createdAt: usersTable.createdAt,
        role: usersTable.role,
        updatedAt: usersTable.updatedAt,
      });

      await tx.insert(subscriptionsTable).values({ userId: created.id, tier: 'free', status: 'active' });

      return created;
    });
  },
  login: async ({ email, password }) => {
    const exist = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });
    if (exist === undefined) throw new UnauthorizedError('Invalid credentials');

    const isPasswordMatch = await _comparePassword(password, exist.password);
    if (!isPasswordMatch) throw new UnauthorizedError('Invalid credentials');

    const { password: _, ...user } = exist;
    const accessToken = _generateJwtToken(user, config.JWT_SECRET, { expiresIn: config.JWT_ACCESS_TOKEN_TTL });
    const refreshToken = _generateJwtToken(user, config.JWT_SECRET, { expiresIn: config.JWT_REFRESH_TOKEN_TTL });

    return { accessToken, refreshToken, ...user };
  },
});
