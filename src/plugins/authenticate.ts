import type { FastifyReply, FastifyRequest } from 'fastify';
import { _verifyJwtToken } from '@/modules/auth/utils/jwt.js';
import { UnauthorizedError } from '@/utils/http-error.js';
import type { jwtPayloadType } from '@/modules/auth/types/index.js';

const extractUser = (decoded: jwtPayloadType | string): { id: string; email: string } => {
  if (typeof decoded !== 'object') throw new UnauthorizedError('Malformed token');
  const { id, email } = decoded;
  if (typeof id !== 'string' || typeof email !== 'string') throw new UnauthorizedError('Malformed token payload');
  return { id, email };
};

export const authenticate = async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
  const {
    cookies: { accessToken },
  } = request;
  if (accessToken === undefined) throw new UnauthorizedError('No access token');

  let decoded: jwtPayloadType | string;
  try {
    decoded = _verifyJwtToken(accessToken, process.env.JWT_SECRET ?? '');
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  Object.assign(request, { user: extractUser(decoded) });
};
