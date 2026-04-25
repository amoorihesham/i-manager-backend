import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Database } from '@/db/connection.js';
import type { Env } from '@/config/env.js';
import { STATUS_CODES } from '@/config/constants.js';
import { _sendSuccessResponse } from '@/utils/http.js';
import { invitationsService } from '@/modules/invitations/invitations.service.js';
import { workspacesService } from './workspaces.service.js';
import { assertWorkspaceRole, loadWorkspaceOrThrow } from './workspaces.guards.js';
import { planLimits } from '@/modules/billing/plan-limits.guard.js';
import type { CreateWorkspaceInput, InviteToWorkspaceInput, UpdateWorkspaceInput } from './schemas/index.js';

export const workspacesController = (db: Database, config: Env) => {
  const service = workspacesService(db);
  const invitations = invitationsService(db, config);

  return {
    create: async (request: FastifyRequest<{ Body: CreateWorkspaceInput }>, reply: FastifyReply) => {
      const ws = await service.create(request.user.id, request.body);
      reply.status(STATUS_CODES.CREATED).send(_sendSuccessResponse('Workspace created', ws));
    },

    list: async (request: FastifyRequest, reply: FastifyReply) => {
      const ws = await service.listForUser(request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Workspaces', ws));
    },

    getById: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const ws = await service.getById(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Workspace', ws));
    },

    update: async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateWorkspaceInput }>,
      reply: FastifyReply
    ) => {
      const ws = await service.update(request.params.id, request.user.id, request.body);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Workspace updated', ws));
    },

    remove: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await service.remove(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Workspace deleted', null));
    },

    listMembers: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const members = await service.listMembers(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Workspace members', members));
    },

    removeMember: async (request: FastifyRequest<{ Params: { id: string; userId: string } }>, reply: FastifyReply) => {
      await service.removeMember(request.params.id, request.user.id, request.params.userId);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Member removed', null));
    },

    invite: async (
      request: FastifyRequest<{ Params: { id: string }; Body: InviteToWorkspaceInput }>,
      reply: FastifyReply
    ) => {
      await assertWorkspaceRole(db, request.params.id, request.user.id, ['owner', 'admin']);
      const workspace = await loadWorkspaceOrThrow(db, request.params.id);
      await planLimits(db).assertCanInviteMember(workspace.ownerId, workspace.id);
      const invitation = await invitations.createWorkspaceInvitation({
        workspaceId: workspace.id,
        email: request.body.email,
        role: request.body.role,
        invitedById: request.user.id,
      });
      reply.status(STATUS_CODES.CREATED).send(_sendSuccessResponse('Invitation sent', invitation));
    },
  };
};
