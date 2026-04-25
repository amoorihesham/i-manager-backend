import z from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export const createWorkspaceJsonSchema = z.toJSONSchema(createWorkspaceSchema, { target: 'draft-07' });

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
});
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export const updateWorkspaceJsonSchema = z.toJSONSchema(updateWorkspaceSchema, { target: 'draft-07' });

export const inviteToWorkspaceSchema = z.object({
  email: z.email(),
  role: z.enum(['admin', 'member']).default('member'),
});
export type InviteToWorkspaceInput = z.infer<typeof inviteToWorkspaceSchema>;
export const inviteToWorkspaceJsonSchema = z.toJSONSchema(inviteToWorkspaceSchema, { target: 'draft-07' });
