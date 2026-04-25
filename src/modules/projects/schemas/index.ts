import z from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(10000).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export const createProjectJsonSchema = z.toJSONSchema(createProjectSchema, { target: 'draft-07' });

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export const updateProjectJsonSchema = z.toJSONSchema(updateProjectSchema, { target: 'draft-07' });

export const inviteToProjectSchema = z.object({
  email: z.email(),
  role: z.enum(['admin', 'member']).default('member'),
});
export type InviteToProjectInput = z.infer<typeof inviteToProjectSchema>;
export const inviteToProjectJsonSchema = z.toJSONSchema(inviteToProjectSchema, { target: 'draft-07' });
