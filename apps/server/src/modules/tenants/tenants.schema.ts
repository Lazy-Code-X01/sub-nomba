import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1).max(100),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().min(8).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
