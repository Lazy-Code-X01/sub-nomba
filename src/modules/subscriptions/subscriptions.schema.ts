import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
});

export const changeSubscriptionStatusSchema = z.object({
  event: z.enum(['START_TRIAL', 'ACTIVATE', 'MARK_PAST_DUE', 'PAUSE', 'CANCEL']),
});

export const changePlanSchema = z.object({
  newPlanId: z.string().uuid(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type ChangeSubscriptionStatusInput = z.infer<typeof changeSubscriptionStatusSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
