import { z } from 'zod';

export const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  nombaCustomerId: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
