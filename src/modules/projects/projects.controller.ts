import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Database } from '@/db/connection.js';
import type { Env } from '@/config/env.js';
import { STATUS_CODES } from '@/config/constants.js';
import { _sendSuccessResponse } from '@/utils/http.js';
import { invitationsService } from '@/modules/invitations/invitations.service.js';
import { projectsService } from './projects.service.js';
import { assertProjectRole, loadProjectOrThrow } from './projects.guards.js';
import type { CreateProjectInput, InviteToProjectInput, UpdateProjectInput } from './schemas/index.js';

interface ProjectsController {
  create: (
    request: FastifyRequest<{ Params: { workspaceId: string }; Body: CreateProjectInput }>,
    reply: FastifyReply
  ) => Promise<void>;
  listInWorkspace: (request: FastifyRequest<{ Params: { workspaceId: string } }>, reply: FastifyReply) => Promise<void>;
  getById: (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => Promise<void>;
  update: (
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateProjectInput }>,
    reply: FastifyReply
  ) => Promise<void>;
  remove: (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => Promise<void>;
  listMembers: (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => Promise<void>;
  invite: (
    request: FastifyRequest<{ Params: { id: string }; Body: InviteToProjectInput }>,
    reply: FastifyReply
  ) => Promise<void>;
}

export const projectsController = (db: Database, config: Env): ProjectsController => {
  const service = projectsService(db);
  const invitations = invitationsService(db, config);

  return {
    create: async (
      request: FastifyRequest<{ Params: { workspaceId: string }; Body: CreateProjectInput }>,
      reply: FastifyReply
    ) => {
      const project = await service.create(request.params.workspaceId, request.user.id, request.body);
      reply.status(STATUS_CODES.CREATED).send(_sendSuccessResponse('Project created', project));
    },

    listInWorkspace: async (request: FastifyRequest<{ Params: { workspaceId: string } }>, reply: FastifyReply) => {
      const projects = await service.listInWorkspace(request.params.workspaceId, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Projects', projects));
    },

    getById: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const project = await service.getById(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Project', project));
    },

    update: async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateProjectInput }>,
      reply: FastifyReply
    ) => {
      const project = await service.update(request.params.id, request.user.id, request.body);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Project updated', project));
    },

    remove: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await service.remove(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Project deleted', null));
    },

    listMembers: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const members = await service.listMembers(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Project members', members));
    },

    invite: async (
      request: FastifyRequest<{ Params: { id: string }; Body: InviteToProjectInput }>,
      reply: FastifyReply
    ) => {
      await assertProjectRole(db, request.params.id, request.user.id, ['admin']);
      const project = await loadProjectOrThrow(db, request.params.id);
      await service.assertInviteeIsWorkspaceMember(project.workspaceId, request.body.email);

      const invitation = await invitations.createProjectInvitation({
        projectId: project.id,
        workspaceId: project.workspaceId,
        email: request.body.email,
        role: request.body.role,
        invitedById: request.user.id,
      });
      reply.status(STATUS_CODES.CREATED).send(_sendSuccessResponse('Invitation sent', invitation));
    },
  };
};
