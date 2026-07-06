import { createHmac } from 'crypto';
import { verifyNombaWebhookSignature } from '../src/nomba/nomba.webhooks';

const SECRET = 'test-webhook-secret-xyz';

const payload = {
  event_type: 'payment_success',
  requestId: 'req-abc-123',
  data: {
    merchant: { userId: 'user-xyz', walletId: 'wallet-abc' },
    order: { orderReference: 'inv_001', customerEmail: 'test@test.com', amount: 100, currency: 'NGN' },
  },
};

function sign(p: typeof payload): string {
  const sigString = `${p.event_type}:${p.requestId}:${p.data.merchant.userId}:${p.data.merchant.walletId}`;
  return createHmac('sha256', SECRET).update(sigString).digest('base64');
}

describe('verifyNombaWebhookSignature', () => {
  it('accepts a valid signature', () => {
    expect(verifyNombaWebhookSignature(payload, sign(payload), SECRET)).toBe(true);
  });

  it('rejects a tampered event_type field', () => {
    const tampered = { ...payload, event_type: 'payment_failed' };
    expect(verifyNombaWebhookSignature(tampered, sign(payload), SECRET)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    expect(verifyNombaWebhookSignature(payload, sign(payload), 'wrong-secret')).toBe(false);
  });

  it('rejects an empty signature', () => {
    expect(verifyNombaWebhookSignature(payload, '', SECRET)).toBe(false);
  });

  it('produces the same signature for identical inputs', () => {
    const sig = sign(payload);
    expect(verifyNombaWebhookSignature(payload, sig, SECRET)).toBe(true);
    expect(verifyNombaWebhookSignature(payload, sig, SECRET)).toBe(true);
  });
});
