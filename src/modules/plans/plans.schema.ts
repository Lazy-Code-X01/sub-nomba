import { z } from 'zod';
import { PlanInterval } from '@prisma/client';

export const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().int().positive(),
  currency: z.string().length(3).default('NGN'),
  interval: z.nativeEnum(PlanInterval),
  intervalCount: z.number().int().min(1).default(1),
  trialDays: z.number().int().min(0).default(0),
});

export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const prorationSchema = z.object({
  oldPlanId: z.string().uuid(),
  newPlanId: z.string().uuid(),
  daysRemainingInCycle: z.number().int().positive(),
  billingDays: z.number().int().positive(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type ProrationInput = z.infer<typeof prorationSchema>;
