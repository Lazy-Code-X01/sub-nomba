import { nombaClient, assertSuccess } from './nomba.client';
import { env } from '../config/env';

export interface CheckoutOrderInput {
  orderReference: string;
  customerEmail: string;
  amount: number;
  currency: string;
  callbackUrl: string;
  description?: string;
}

export interface CheckoutOrderResult {
  checkoutLink: string;
  orderReference: string;
}

interface NombaCheckoutData {
  checkoutLink: string;
  orderReference: string;
}

export async function createCheckoutOrder(input: CheckoutOrderInput): Promise<CheckoutOrderResult> {
  const res = await nombaClient.post<{ code: string; description: string; data: NombaCheckoutData }>(
    env.nomba.checkoutPath,
    {
      order: {
        orderReference: input.orderReference,
        callbackUrl: input.callbackUrl,
        customerEmail: input.customerEmail,
        description: input.description ?? 'Subscription payment',
        currency: input.currency,
        amount: input.amount,
        tokenizeCard: true,
        // subAccountId routed in order.accountId per Nomba docs
        accountId: env.nomba.subAccountId || undefined,
      },
      customer: {
        customerEmail: input.customerEmail,
      },
    },
  );

  return assertSuccess<CheckoutOrderResult>(res);
}
