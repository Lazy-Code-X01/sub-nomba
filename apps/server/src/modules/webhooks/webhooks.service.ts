import { prisma } from '../../db/client';
import { AppError } from '../../middleware/error-handler';

export async function listWebhookEvents(tenantId: string) {
  return prisma.webhookEvent.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

export async function getWebhookEvent(tenantId: string, eventId: string) {
  const event = await prisma.webhookEvent.findFirst({ where: { id: eventId, tenantId } });
  if (!event) throw new AppError(404, 'Webhook event not found');
  return event;
}
