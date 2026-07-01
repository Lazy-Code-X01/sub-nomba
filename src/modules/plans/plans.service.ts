import { prisma } from '../../db/client';
import { AppError } from '../../middleware/error-handler';
import { CreatePlanInput, UpdatePlanInput } from './plans.schema';

export async function createPlan(tenantId: string, input: CreatePlanInput) {
  return prisma.plan.create({
    data: {
      tenantId,
      name: input.name,
      amount: input.amount,
      currency: input.currency,
      interval: input.interval,
      intervalCount: input.intervalCount,
      trialDays: input.trialDays,
    },
  });
}

export async function getPlan(tenantId: string, planId: string) {
  const plan = await prisma.plan.findFirst({ where: { id: planId, tenantId } });
  if (!plan) throw new AppError(404, 'Plan not found');
  return plan;
}

export async function listPlans(tenantId: string) {
  return prisma.plan.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
}

export async function updatePlan(tenantId: string, planId: string, input: UpdatePlanInput) {
  await getPlan(tenantId, planId);
  return prisma.plan.update({ where: { id: planId }, data: input });
}

export async function deletePlan(tenantId: string, planId: string) {
  await getPlan(tenantId, planId);
  return prisma.plan.update({ where: { id: planId }, data: { isActive: false } });
}

export interface ProrationResult {
  creditAmount: number;
  newChargeAmount: number;
}

export function calculateProration(
  oldPlanAmount: number,
  newPlanAmount: number,
  daysRemainingInCycle: number,
  billingDays: number
): ProrationResult {
  const creditAmount = Math.round((daysRemainingInCycle / billingDays) * oldPlanAmount);
  const newChargeAmount = Math.round((daysRemainingInCycle / billingDays) * newPlanAmount);
  return { creditAmount, newChargeAmount };
}

export async function previewProration(
  tenantId: string,
  oldPlanId: string,
  newPlanId: string,
  daysRemainingInCycle: number,
  billingDays: number
): Promise<ProrationResult> {
  const [oldPlan, newPlan] = await Promise.all([
    getPlan(tenantId, oldPlanId),
    getPlan(tenantId, newPlanId),
  ]);
  return calculateProration(oldPlan.amount, newPlan.amount, daysRemainingInCycle, billingDays);
}
