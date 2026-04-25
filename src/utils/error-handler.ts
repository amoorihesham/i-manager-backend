import { STATUS_CODES } from '@/config/constants.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { HttpError, PlanLimitExceededError } from './http-error.js';
import { _sendErrorResponse } from './http.js';

export default function errorHandler(error: unknown, _request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof PlanLimitExceededError) {
    reply.status(error.statusCode).send({
      ..._sendErrorResponse(error.message, error.code),
      upgradeUrl: error.upgradeUrl,
    });
    return;
  }

  if (error instanceof HttpError) {
    reply.status(error.statusCode).send(_sendErrorResponse(error.message, error.code));
    return;
  }

  reply.log.error(error);
  reply.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(_sendErrorResponse('Internal Server Error', 'INTERNAL_ERROR'));
}
