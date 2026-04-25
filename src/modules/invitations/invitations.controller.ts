import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Database } from '@/db/connection.js';
import type { Env } from '@/config/env.js';
import { STATUS_CODES } from '@/config/constants.js';
import { _sendSuccessResponse } from '@/utils/http.js';
import { invitationsService } from './invitations.service.js';

export const invitationsController = (db: Database, config: Env) => {
  const service = invitationsService(db, config);

  return {
    preview: async (request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) => {
      const data = await service.preview(request.params.token);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Invitation', data));
    },

    accept: async (request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) => {
      const result = await service.accept({
        token: request.params.token,
        userId: request.user.id,
        userEmail: request.user.email,
      });
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Invitation accepted', result));
    },

    revoke: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await service.revoke(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Invitation revoked', null));
    },
  };
};
