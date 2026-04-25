import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Database } from '@/db/connection.js';
import { STATUS_CODES } from '@/config/constants.js';
import { _sendSuccessResponse } from '@/utils/http.js';
import { tasksService } from './tasks.service.js';
import type { CreateTaskInput, UpdateTaskInput } from './schemas/index.js';

export const tasksController = (db: Database) => {
  const service = tasksService(db);

  return {
    create: async (
      request: FastifyRequest<{ Params: { projectId: string }; Body: CreateTaskInput }>,
      reply: FastifyReply
    ) => {
      const task = await service.create(request.params.projectId, request.user.id, request.body);
      reply.status(STATUS_CODES.CREATED).send(_sendSuccessResponse('Task created', task));
    },

    listInProject: async (request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) => {
      const tasks = await service.listInProject(request.params.projectId, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Tasks', tasks));
    },

    getById: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const task = await service.getById(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Task', task));
    },

    update: async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateTaskInput }>, reply: FastifyReply) => {
      const task = await service.update(request.params.id, request.user.id, request.body);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Task updated', task));
    },

    remove: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await service.remove(request.params.id, request.user.id);
      reply.status(STATUS_CODES.OK).send(_sendSuccessResponse('Task deleted', null));
    },
  };
};
