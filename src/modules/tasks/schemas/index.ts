import z from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(10000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  assigneeId: z.uuid().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export const createTaskJsonSchema = z.toJSONSchema(createTaskSchema, { target: 'draft-07' });

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  assigneeId: z.uuid().nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export const updateTaskJsonSchema = z.toJSONSchema(updateTaskSchema, { target: 'draft-07' });
