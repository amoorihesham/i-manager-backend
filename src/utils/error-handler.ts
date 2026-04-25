import { STATUS_CODES } from '@/config/constants.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export default function errorHandler(error: unknown, _request: FastifyRequest, reply: FastifyReply): void {
  reply.log.error(error);
  reply.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
}
