import z from 'zod';

export const checkoutSchema = z.object({
  tier: z.enum(['pro', 'ultra']),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export const checkoutJsonSchema = z.toJSONSchema(checkoutSchema, { target: 'draft-07' });
