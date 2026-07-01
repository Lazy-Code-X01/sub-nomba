import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/error-handler';
import { transition } from './state-machine';
import { enqueueDunning } from '../../queues/dunning.queue';
import { dispatchWebhook } from '../webhooks/webhooks.dispatcher';
import { CreateSubscriptionInput, ChangePlanInput } from './subscriptions.schema';
import { calculateProration } from '../plans/plans.service';

function computePeriodEnd(start: Date, interval: string, intervalCount: number): Date {
  const end = new Date(start);
  if (interval === 'MONTHLY') end.setMonth(end.getMonth() + intervalCount);
  else if (interval === 'ANNUAL') end.setFullYear(end.getFullYear() + intervalCount);
  else end.setDate(end.getDate() + 30 * intervalCount);
  return end;
}

export async function createSubscription(tenantId: string, input: CreateSubscriptionInput) {
  const [customer, plan] = await Promise.all([
    prisma.customer.findFirst({ where: { id: input.customerId, tenantId } }),
    prisma.plan.findFirst({ where: { id: input.planId, tenantId, isActive: true } }),
  ]);
  if (!customer) throw new AppError(404, 'Customer not found');
  if (!plan) throw new AppError(404, 'Plan not found or inactive');

  const start = input.startDate ? new Date(input.startDate) : new Date();
  const trialEnd =
    plan.trialDays > 0 ? new Date(start.getTime() + plan.trialDays * 86400_000) : null;
  const periodStart = trialEnd ?? start;
  const periodEnd = computePeriodEnd(periodStart, plan.interval, plan.intervalCount);

  const sub = await prisma.subscription.create({
    data: {
      tenantId,
      customerId: input.customerId,
      planId: input.planId,
      status: trialEnd ? SubscriptionStatus.TRIALING : SubscriptionStatus.CREATED,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialEnd,
    },
    include: { plan: true, customer: true },
  });

  await dispatchWebhook(tenantId, 'subscription.created', sub);
  return sub;
}

export async function getSubscription(tenantId: string, subscriptionId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, tenantId },
    include: { plan: true, customer: true },
  });
  if (!sub) throw new AppError(404, 'Subscription not found');
  return sub;
}

export async function listSubscriptions(tenantId: string, status?: SubscriptionStatus) {
  return prisma.subscription.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    include: { plan: true, customer: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function applyStatusEvent(tenantId: string, subscriptionId: string, event: string) {
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, tenantId } });
  if (!sub) throw new AppError(404, 'Subscription not found');

  const nextStatus = transition(sub.status, event as Parameters<typeof transition>[1]);

  const updateData: Record<string, unknown> = { status: nextStatus };
  if (nextStatus === SubscriptionStatus.PAUSED) updateData.pausedAt = new Date();
  if (nextStatus === SubscriptionStatus.CANCELLED) updateData.cancelledAt = new Date();

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: updateData,
    include: { plan: true, customer: true },
  });

  await dispatchWebhook(tenantId, `subscription.${nextStatus.toLowerCase()}`, updated);
  return updated;
}

export async function changePlan(tenantId: string, subscriptionId: string, input: ChangePlanInput) {
  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, tenantId },
    include: { plan: true },
  });
  if (!sub) throw new AppError(404, 'Subscription not found');
  if (sub.status !== SubscriptionStatus.ACTIVE) {
    throw new AppError(409, 'Can only change plan on an active subscription');
  }

  const newPlan = await prisma.plan.findFirst({
    where: { id: input.newPlanId, tenantId, isActive: true },
  });
  if (!newPlan) throw new AppError(404, 'New plan not found or inactive');

  const now = new Date();
  const totalMs = sub.currentPeriodEnd.getTime() - sub.currentPeriodStart.getTime();
  const remainingMs = sub.currentPeriodEnd.getTime() - now.getTime();
  const billingDays = Math.ceil(totalMs / 86400_000);
  const daysRemaining = Math.ceil(remainingMs / 86400_000);

  const proration = calculateProration(sub.plan.amount, newPlan.amount, daysRemaining, billingDays);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { planId: input.newPlanId },
    include: { plan: true, customer: true },
  });

  await dispatchWebhook(tenantId, 'subscription.plan_changed', {
    subscription: updated,
    proration,
  });
  return { subscription: updated, proration };
}

export async function cancelSubscription(tenantId: string, subscriptionId: string) {
  return applyStatusEvent(tenantId, subscriptionId, 'CANCEL');
}

export async function pauseSubscription(tenantId: string, subscriptionId: string) {
  return applyStatusEvent(tenantId, subscriptionId, 'PAUSE');
}

export async function resumeSubscription(tenantId: string, subscriptionId: string) {
  return applyStatusEvent(tenantId, subscriptionId, 'ACTIVATE');
}

export async function markSubscriptionPastDue(subscriptionId: string) {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new AppError(404, 'Subscription not found');
  return applyStatusEvent(sub.tenantId, subscriptionId, 'MARK_PAST_DUE');
}

export async function handleFailedInvoice(invoiceId: string, subscriptionId: string) {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return;

  await markSubscriptionPastDue(subscriptionId);
  await enqueueDunning(invoiceId, subscriptionId);
}
