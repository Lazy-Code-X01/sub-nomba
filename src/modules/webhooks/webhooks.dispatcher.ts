import { createHmac } from 'crypto';
import axios from 'axios';
import { WebhookEventStatus } from '@prisma/client';
import { prisma } from '../../db/client';

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 2000;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

async function send(webhookUrl: string, webhookSecret: string, payload: unknown): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = sign(body, webhookSecret);
  await axios.post(webhookUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Sub-Signature': signature,
      'X-Sub-Timestamp': Date.now().toString(),
    },
    timeout: 10_000,
  });
}

export async function dispatchWebhook(
  tenantId: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant?.webhookUrl || !tenant?.webhookSecret) return;

  const event = await prisma.webhookEvent.create({
    data: { tenantId, eventType, payload: payload as object, status: WebhookEventStatus.PENDING },
  });

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < MAX_ATTEMPTS) {
    try {
      await send(tenant.webhookUrl, tenant.webhookSecret, {
        id: event.id,
        eventType,
        data: payload,
        timestamp: new Date().toISOString(),
      });

      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: WebhookEventStatus.DELIVERED,
          attempts: attempt + 1,
          lastAttemptAt: new Date(),
        },
      });
      return;
    } catch (err) {
      lastError = err as Error;
      attempt++;

      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          attempts: attempt,
          lastAttemptAt: new Date(),
          nextRetryAt:
            attempt < MAX_ATTEMPTS
              ? new Date(Date.now() + BACKOFF_BASE_MS * Math.pow(2, attempt - 1))
              : null,
        },
      });

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, BACKOFF_BASE_MS * Math.pow(2, attempt - 1)));
      }
    }
  }

  await prisma.webhookEvent.update({
    where: { id: event.id },
    data: { status: WebhookEventStatus.FAILED },
  });

  console.error(
    `[Webhook] failed after ${MAX_ATTEMPTS} attempts for event ${eventType}:`,
    lastError?.message
  );
}
