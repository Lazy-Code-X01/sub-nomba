import { createHmac } from 'crypto';
import { verifyNombaWebhookSignature } from '../src/nomba/nomba.webhooks';

const SECRET = 'test-webhook-secret-xyz';

const payload = {
  event: 'payment_success',
  requestId: 'req-abc-123',
  merchant: { userId: 'user-xyz', walletId: 'wallet-abc' },
  data: { orderReference: 'inv_001' },
};

function sign(p: typeof payload): string {
  const sigString = `${p.event}:${p.requestId}:${p.merchant.userId}:${p.merchant.walletId}`;
  return createHmac('sha256', SECRET).update(sigString).digest('hex');
}

describe('verifyNombaWebhookSignature', () => {
  it('accepts a valid signature', () => {
    expect(verifyNombaWebhookSignature(payload, sign(payload), SECRET)).toBe(true);
  });

  it('rejects a tampered event field', () => {
    const tampered = { ...payload, event: 'payment_failed' };
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
