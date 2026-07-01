import { createHmac } from 'crypto';
import { verifyNombaWebhookSignature } from '../src/nomba/nomba.webhooks';

const SECRET = 'test-webhook-secret-xyz';

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body).digest('hex');
}

describe('verifyNombaWebhookSignature', () => {
  const body = JSON.stringify({ event: 'payment_success', data: { orderReference: 'inv_001' } });

  it('accepts a valid signature', () => {
    expect(verifyNombaWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const tampered = body.replace('inv_001', 'inv_999');
    expect(verifyNombaWebhookSignature(tampered, sign(body), SECRET)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    expect(verifyNombaWebhookSignature(body, sign(body), 'wrong-secret')).toBe(false);
  });

  it('rejects an empty signature', () => {
    expect(verifyNombaWebhookSignature(body, '', SECRET)).toBe(false);
  });

  it('produces the same signature for identical inputs', () => {
    const sig = sign(body);
    expect(verifyNombaWebhookSignature(body, sig, SECRET)).toBe(true);
    expect(verifyNombaWebhookSignature(body, sig, SECRET)).toBe(true);
  });
});
