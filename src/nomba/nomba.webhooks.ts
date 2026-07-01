import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { InvoiceStatus, SubscriptionStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../db/client';
import { transition, canTransition } from '../modules/subscriptions/state-machine';
import { enqueueDunning } from '../queues/dunning.queue';
import { dispatchWebhook } from '../modules/webhooks/webhooks.dispatcher';

export function verifyNombaWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

interface NombaPaymentSuccessData {
  orderReference: string;
  transactionId: string;
  amount: number;
  currency: string;
  tokenKey?: string;
  customerEmail: string;
}

interface NombaPaymentFailedData {
  orderReference: string;
  customerEmail: string;
  amount: number;
  reason?: string;
}

interface NombaWebhookPayload {
  event: string;
  data: NombaPaymentSuccessData | NombaPaymentFailedData;
}

async function handlePaymentSuccess(data: NombaPaymentSuccessData): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { nombaOrderRef: data.orderReference },
  });
  if (!invoice) {
    console.warn(`[Nomba Webhook] invoice not found for orderReference: ${data.orderReference}`);
    return;
  }

  // Idempotency guard: webhook may be delivered more than once
  if (invoice.status === InvoiceStatus.PAID) return;

  // Persist the tokenKey so future dunning and renewal charges can reuse the card
  if (data.tokenKey) {
    await prisma.customer.updateMany({
      where: { id: invoice.customerId, tenantId: invoice.tenantId },
      data: { tokenisedCard: data.tokenKey },
    });
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: InvoiceStatus.PAID,
      paidAt: new Date(),
      nombaChargeRef: data.transactionId,
    },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { id: invoice.subscriptionId },
    include: { plan: true, customer: true },
  });

  if (subscription && canTransition(subscription.status, 'ACTIVATE')) {
    const nextStatus = transition(subscription.status, 'ACTIVATE');
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: nextStatus },
      include: { plan: true, customer: true },
    });

    await dispatchWebhook(invoice.tenantId, 'subscription.activated', {
      subscription: updated,
      invoice: { id: invoice.id, paidAt: new Date(), nombaChargeRef: data.transactionId },
    });
  }
}

async function handlePaymentFailed(data: NombaPaymentFailedData): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { nombaOrderRef: data.orderReference },
  });
  if (!invoice) {
    console.warn(`[Nomba Webhook] invoice not found for orderReference: ${data.orderReference}`);
    return;
  }

  // Idempotency guard: webhook may be delivered more than once
  if (invoice.status === InvoiceStatus.FAILED) return;

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: InvoiceStatus.FAILED },
  });

  const subscription = await prisma.subscription.findUnique({ where: { id: invoice.subscriptionId } });

  if (subscription && canTransition(subscription.status, 'MARK_PAST_DUE')) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    await dispatchWebhook(invoice.tenantId, 'subscription.past_due', {
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      reason: data.reason,
    });
  }

  await enqueueDunning(invoice.id, invoice.subscriptionId);
}

// Express handler: return 200 immediately, then process the event asynchronously.
// Nomba expects a response within a few seconds or it will retry delivery.
export function nombaWebhookHandler(req: Request, res: Response): void {
  // req.body is a raw Buffer because this route uses express.raw(), not express.json()
  const rawBody = (req.body as Buffer).toString('utf8');
  const signature = (req.headers['nomba-signature'] as string) ?? '';

  if (!verifyNombaWebhookSignature(rawBody, signature, env.nomba.webhookSecret)) {
    // Return 200 even on bad signature to avoid leaking timing information to an attacker
    console.warn('[Nomba Webhook] signature verification failed');
    res.sendStatus(200);
    return;
  }

  res.sendStatus(200);

  let payload: NombaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as NombaWebhookPayload;
  } catch {
    console.error('[Nomba Webhook] failed to parse body');
    return;
  }

  const { event, data } = payload;
  console.log(`[Nomba Webhook] received: ${event}`);

  const processor =
    event === 'payment_success'
      ? handlePaymentSuccess(data as NombaPaymentSuccessData)
      : event === 'payment_failed'
        ? handlePaymentFailed(data as NombaPaymentFailedData)
        : Promise.resolve();

  processor.catch((err: Error) => {
    console.error(`[Nomba Webhook] error processing ${event}:`, err.message);
  });
}
