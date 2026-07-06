import { nombaClient, assertSuccess } from './nomba.client';

export interface ChargeCardInput {
  orderReference: string;
  customerEmail: string;
  amount: number;
  currency: string;
  tokenKey: string;
  callbackUrl: string;
}

export interface ChargeResult {
  success: boolean;
  transactionId: string;
}

interface NombaChargeData {
  orderReference: string;
  transactionId?: string;
  status?: string;
}

interface NombaTransactionData {
  transactionId: string;
  orderReference: string;
  status: string; // "SUCCESS" | "FAILED" | "PENDING"
  amount: number;
  currency: string;
}

export async function chargeTokenisedCard(input: ChargeCardInput): Promise<ChargeResult> {
  const chargeRes = await nombaClient.post<{
    code: string;
    description: string;
    data: NombaChargeData;
  }>('/v1/checkout/tokenized-card-payment', {
    orderReference: input.orderReference,
    customerEmail: input.customerEmail,
    amount: input.amount,
    currency: input.currency,
    tokenKey: input.tokenKey,
    callbackUrl: input.callbackUrl,
  });

  assertSuccess<NombaChargeData>(chargeRes);

  // verify after initiating the charge; Nomba charges can be asynchronous
  const txnRes = await nombaClient.get<{
    code: string;
    description: string;
    data: NombaTransactionData;
  }>(`/v1/checkout/transaction/${encodeURIComponent(input.orderReference)}`);

  const txn = assertSuccess<NombaTransactionData>(txnRes);

  return {
    success: txn.status === 'SUCCESS',
    transactionId: txn.transactionId,
  };
}
