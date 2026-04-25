import { STATUS_CODES } from '@/config/constants.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export function authenticate(request: FastifyRequest, reply: FastifyReply): void {
  try {
    const {
      cookies: { accessToken },
    } = request;

    if (accessToken === undefined) throw new Error('No token');

    // TODO: Implement JWT verification
  } catch {
    reply.status(STATUS_CODES.UNAUTHORIZED).send({ error: 'Unauthorized' });
  }
}
