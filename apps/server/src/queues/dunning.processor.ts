import { Worker, Job } from 'bullmq';
import { DunningStatus, InvoiceStatus, SubscriptionStatus } from '@prisma/client';
import { getRedisUrl } from '../config/redis';
import { env } from '../config/env';
import { prisma } from '../db/client';
import { DUNNING_QUEUE, DunningJobData } from './dunning.queue';
import { chargeTokenisedCard } from '../nomba/nomba.charge';
import { transition } from '../modules/subscriptions/state-machine';
import { dispatchWebhook } from '../modules/webhooks/webhooks.dispatcher';

const MAX_ATTEMPTS = 4;

async function processDunningJob(job: Job<DunningJobData>): Promise<void> {
  const { invoiceId, subscriptionId, attemptNumber } = job.data;

  const [invoice, subscription] = await Promise.all([
    prisma.invoice.findUnique({ where: { id: invoiceId } }),
    prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { customer: true } }),
  ]);

  if (!invoice || !subscription) {
    console.warn(`[Dunning] missing invoice ${invoiceId} or subscription ${subscriptionId}`);
    return;
  }

  if (invoice.status === InvoiceStatus.PAID) return;
  if (subscription.status === SubscriptionStatus.CANCELLED) return;

  const attempt = await prisma.dunningAttempt.create({
    data: {
      invoiceId,
      subscriptionId,
      attemptNumber,
      status: DunningStatus.PENDING,
      scheduledAt: new Date(job.processedOn ?? Date.now()),
    },
  });

  let chargeRef: string | null = null;
  let failureReason: string | null = null;
  let succeeded = false;

  try {
    const token = subscription.customer.tokenisedCard;
    const isValidToken = Boolean(token && token.trim() !== '' && token !== 'N/A');
    if (!isValidToken) {
      console.log(`[Billing] subscription ${subscriptionId} has no valid tokenised card - skipping charge`);
      throw new Error('No valid tokenised card on file');
    }

    const result = await chargeTokenisedCard({
      tokenKey: token as string,
      customerEmail: subscription.customer.email,
      amount: invoice.amount,
      currency: invoice.currency,
      orderReference: `dunning_${invoiceId}_${attemptNumber}`,
      callbackUrl: `${env.appUrl}/nomba/webhooks`,
    });

    chargeRef = result.transactionId;
    succeeded = result.success;
    if (!succeeded) failureReason = 'Transaction verification returned non-SUCCESS status';
  } catch (err) {
    failureReason = (err as Error).message;
  }

  if (succeeded) {
    await Promise.all([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.PAID, paidAt: new Date(), nombaChargeRef: chargeRef },
      }),
      prisma.dunningAttempt.update({
        where: { id: attempt.id },
        data: { status: DunningStatus.SUCCESS, executedAt: new Date(), nombaChargeRef: chargeRef },
      }),
    ]);

    const nextStatus = transition(subscription.status, 'ACTIVATE');
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: nextStatus },
    });

    await dispatchWebhook(subscription.tenantId, 'dunning.recovered', {
      invoiceId,
      subscriptionId,
      attemptNumber,
    });
    return;
  }

  await prisma.dunningAttempt.update({
    where: { id: attempt.id },
    data: { status: DunningStatus.FAILED, executedAt: new Date(), failureReason },
  });

  if (attemptNumber >= MAX_ATTEMPTS) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
    });
    await dispatchWebhook(subscription.tenantId, 'subscription.cancelled', {
      subscriptionId,
      reason: 'dunning_exhausted',
    });
  }
}

export function startDunningWorker(): Worker<DunningJobData> {
  const worker = new Worker<DunningJobData>(DUNNING_QUEUE, processDunningJob, {
    connection: { url: getRedisUrl() },
    concurrency: 5,
  });

  worker.on('failed', (job, err) => {
    console.error(`[Dunning] job ${job?.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    console.log(`[Dunning] job ${job.id} completed`);
  });

  return worker;
}
