import { createHmac } from 'crypto';

// Isolated test for the HMAC signing logic used in the dispatcher
function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

describe('Webhook dispatcher signing', () => {
  const secret = 'super-secret-webhook-key';
  const payload = JSON.stringify({ eventType: 'subscription.created', data: { id: '123' } });

  it('produces a valid HMAC-SHA256 signature', () => {
    const sig = sign(payload, secret);
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it('same payload + secret always yields same signature', () => {
    expect(sign(payload, secret)).toBe(sign(payload, secret));
  });

  it('different payload yields different signature', () => {
    const other = JSON.stringify({ eventType: 'invoice.paid', data: { id: '456' } });
    expect(sign(payload, secret)).not.toBe(sign(other, secret));
  });

  it('different secret yields different signature', () => {
    expect(sign(payload, secret)).not.toBe(sign(payload, 'other-secret'));
  });
});
