import { Queue, Worker, Job } from 'bullmq';
import { SubscriptionStatus } from '@prisma/client';
import { getRedisUrl } from '../config/redis';
import { env } from '../config/env';
import { prisma } from '../db/client';
import {
  createInvoice,
  markInvoiceFailed,
  markInvoicePaid,
} from '../modules/invoices/invoices.service';
import { chargeTokenisedCard } from '../nomba/nomba.charge';

export interface BillingJobData {
  subscriptionId: string;
}

export const BILLING_QUEUE = 'billing';

let billingQueue: Queue<BillingJobData> | null = null;

export function getBillingQueue(): Queue<BillingJobData> {
  if (!billingQueue) {
    billingQueue = new Queue<BillingJobData>(BILLING_QUEUE, {
      connection: { url: getRedisUrl() },
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    });
  }
  return billingQueue;
}

async function processBillingJob(job: Job<BillingJobData>): Promise<void> {
  const { subscriptionId } = job.data;

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, customer: true },
  });

  if (!sub || sub.status !== SubscriptionStatus.ACTIVE) return;

  const invoice = await createInvoice(
    sub.tenantId,
    subscriptionId,
    sub.customerId,
    sub.plan.amount,
    sub.plan.currency,
    sub.currentPeriodEnd
  );

  try {
    if (!sub.customer.tokenisedCard) throw new Error('No tokenised card');

    const result = await chargeTokenisedCard({
      tokenKey: sub.customer.tokenisedCard,
      customerEmail: sub.customer.email,
      amount: invoice.amount,
      currency: invoice.currency,
      orderReference: `billing_${invoice.id}`,
      callbackUrl: `${env.appUrl}/nomba/webhooks`,
    });

    if (!result.success) throw new Error('Transaction verification returned non-SUCCESS status');
    await markInvoicePaid(sub.tenantId, invoice.id, result.transactionId);

    const newStart = sub.currentPeriodEnd;
    const newEnd = new Date(newStart);
    if (sub.plan.interval === 'MONTHLY')
      newEnd.setMonth(newEnd.getMonth() + sub.plan.intervalCount);
    else if (sub.plan.interval === 'ANNUAL')
      newEnd.setFullYear(newEnd.getFullYear() + sub.plan.intervalCount);
    else newEnd.setDate(newEnd.getDate() + 30 * sub.plan.intervalCount);

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { currentPeriodStart: newStart, currentPeriodEnd: newEnd },
    });
  } catch (_err) {
    await markInvoiceFailed(sub.tenantId, invoice.id, subscriptionId);
  }
}

export function startBillingWorker(): Worker<BillingJobData> {
  const worker = new Worker<BillingJobData>(BILLING_QUEUE, processBillingJob, {
    connection: { url: getRedisUrl() },
    concurrency: 10,
  });

  worker.on('failed', (job, err) => {
    console.error(`[Billing] job ${job?.id} failed:`, err.message);
  });

  return worker;
}
