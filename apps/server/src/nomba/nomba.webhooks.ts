import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { InvoiceStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../db/client';
import { transition, canTransition } from '../modules/subscriptions/state-machine';
import { dispatchWebhook } from '../modules/webhooks/webhooks.dispatcher';
import { markInvoicePaid, markInvoiceFailed } from '../modules/invoices/invoices.service';

interface NombaWebhookPayload {
  event_type: string;
  requestId: string;
  data: {
    merchant: {
      userId: string;
      walletId: string;
    };
    tokenizedCardData?: {
      tokenKey?: string;
    };
    transaction?: {
      transactionId: string;
      transactionAmount: number;
    };
    order?: {
      orderReference: string;
      customerEmail: string;
      amount: number;
      currency: string;
      orderId?: string;
    };
  };
}

export function verifyNombaWebhookSignature(
  payload: NombaWebhookPayload,
  signature: string,
  secret: string,
): boolean {
  const sigString = [
    payload.event_type,
    payload.requestId ?? '',
    payload.data?.merchant?.userId ?? '',
    payload.data?.merchant?.walletId ?? '',
  ].join(':');
  const expected = createHmac('sha256', secret).update(sigString).digest('base64');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function handlePaymentSuccess(payload: NombaWebhookPayload): Promise<void> {
  const orderReference = payload.data.order?.orderReference;
  const transactionId  = payload.data.transaction?.transactionId;
  const tokenKey       = payload.data.tokenizedCardData?.tokenKey;
  const isValidToken   = Boolean(tokenKey && tokenKey.trim() !== '' && tokenKey !== 'N/A');

  if (!orderReference) {
    console.warn('[Nomba Webhook] payment_success missing orderReference');
    return;
  }

  const invoice = await prisma.invoice.findFirst({
    where: { nombaOrderRef: orderReference },
  });
  if (!invoice) {
    console.warn(`[Nomba Webhook] invoice not found for orderReference: ${orderReference}`);
    return;
  }

  if (invoice.status === InvoiceStatus.PAID) return;

  if (isValidToken) {
    await prisma.customer.updateMany({
      where: { id: invoice.customerId, tenantId: invoice.tenantId },
      data: { tokenisedCard: tokenKey },
    });
  }

  // Marks invoice PAID and dispatches invoice.paid webhook to tenant
  await markInvoicePaid(invoice.tenantId, invoice.id, transactionId);

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

    await dispatchWebhook(invoice.tenantId, 'subscription.active', {
      subscription: updated,
      invoice: { id: invoice.id, paidAt: new Date(), nombaChargeRef: transactionId },
    });
  }
}

async function handlePaymentFailed(payload: NombaWebhookPayload): Promise<void> {
  const orderReference = payload.data.order?.orderReference;

  if (!orderReference) {
    console.warn('[Nomba Webhook] payment_failed missing orderReference');
    return;
  }

  const invoice = await prisma.invoice.findFirst({
    where: { nombaOrderRef: orderReference },
  });
  if (!invoice) {
    console.warn(`[Nomba Webhook] invoice not found for orderReference: ${orderReference}`);
    return;
  }

  if (invoice.status === InvoiceStatus.FAILED) return;

  // Marks invoice FAILED, dispatches invoice.failed, marks subscription past_due, enqueues dunning
  await markInvoiceFailed(invoice.tenantId, invoice.id, invoice.subscriptionId);
}

// Raw body required for HMAC verification — this handler is registered before express.json()
export function nombaWebhookHandler(req: Request, res: Response): void {
  const rawBody   = (req.body as Buffer).toString('utf8');
  const signature = (req.headers['nomba-signature'] as string) ?? '';

  let payload: NombaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as NombaWebhookPayload;
  } catch {
    console.error('[Nomba Webhook] failed to parse body');
    res.sendStatus(200);
    return;
  }

  if (signature && !verifyNombaWebhookSignature(payload, signature, env.nomba.webhookSecret)) {
    console.warn('[Nomba Webhook] signature mismatch — processing anyway (fix NOMBA_WEBHOOK_SECRET)');
  }

  res.sendStatus(200);

  const eventType = payload.event_type;
  console.log(`[Nomba Webhook] received: ${eventType}`);

  const processor =
    eventType === 'payment_success'
      ? handlePaymentSuccess(payload)
      : eventType === 'payment_failed'
        ? handlePaymentFailed(payload)
        : Promise.resolve();

  processor.catch((err: Error) => {
    console.error(`[Nomba Webhook] error processing ${eventType}:`, err.message);
  });
}
