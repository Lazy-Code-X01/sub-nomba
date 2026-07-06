import { InvoiceStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/error-handler';
import { handleFailedInvoice } from '../subscriptions/subscriptions.service';
import { dispatchWebhook } from '../webhooks/webhooks.dispatcher';
import { createCheckoutOrder } from '../../nomba/nomba.checkout';
import { env } from '../../config/env';

export async function createInvoice(
  tenantId: string,
  subscriptionId: string,
  customerId: string,
  amount: number,
  currency: string,
  dueDate: Date,
) {
  const invoice = await prisma.invoice.create({
    data: { tenantId, subscriptionId, customerId, amount, currency, dueDate },
  });
  await dispatchWebhook(tenantId, 'invoice.created', invoice);
  return invoice;
}

export async function getInvoice(tenantId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
  if (!invoice) throw new AppError(404, 'Invoice not found');
  return invoice;
}

export async function listInvoices(tenantId: string, subscriptionId?: string) {
  return prisma.invoice.findMany({
    where: { tenantId, ...(subscriptionId ? { subscriptionId } : {}) },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markInvoicePaid(tenantId: string, invoiceId: string, nombaChargeRef?: string) {
  const invoice = await getInvoice(tenantId, invoiceId);
  if (invoice.status === InvoiceStatus.PAID) return invoice;

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.PAID, paidAt: new Date(), nombaChargeRef },
  });
  await dispatchWebhook(tenantId, 'invoice.paid', updated);
  return updated;
}

export async function markInvoiceFailed(
  tenantId: string,
  invoiceId: string,
  subscriptionId: string,
) {
  const invoice = await getInvoice(tenantId, invoiceId);
  if (invoice.status === InvoiceStatus.FAILED) return invoice;

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.FAILED },
  });

  await dispatchWebhook(tenantId, 'invoice.failed', updated);
  await handleFailedInvoice(invoiceId, subscriptionId);
  return updated;
}

export async function createCheckoutForInvoice(tenantId: string, invoiceId: string) {
  const invoice = await getInvoice(tenantId, invoiceId);
  if (invoice.status !== InvoiceStatus.PENDING) {
    throw new AppError(409, `Cannot initiate checkout for a ${invoice.status} invoice`);
  }

  const customer = await prisma.customer.findUnique({ where: { id: invoice.customerId } });
  if (!customer) throw new AppError(404, 'Customer not found');

  const checkout = await createCheckoutOrder({
    orderReference: `${invoice.id}-${Date.now()}`,
    customerEmail: customer.email,
    amount: invoice.amount,
    currency: invoice.currency,
    callbackUrl: `${env.appUrl}/nomba/webhooks`,
    description: `Invoice ${invoice.id}`,
  });

  // Store Nomba's generated orderReference so the inbound webhook can find this invoice
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { nombaOrderRef: checkout.orderReference },
  });

  return { checkoutLink: checkout.checkoutLink, orderReference: checkout.orderReference, invoiceId };
}

export async function voidInvoice(tenantId: string, invoiceId: string) {
  const invoice = await getInvoice(tenantId, invoiceId);
  if (([InvoiceStatus.PAID, InvoiceStatus.VOID] as InvoiceStatus[]).includes(invoice.status)) {
    throw new AppError(409, 'Cannot void a paid or already voided invoice');
  }
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.VOID },
  });
  await dispatchWebhook(tenantId, 'invoice.voided', updated);
  return updated;
}
