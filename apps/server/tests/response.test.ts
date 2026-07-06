import { ok, fail } from '../src/modules/shared/response';

describe('Response helpers', () => {
  describe('ok()', () => {
    it('returns success=true with default message', () => {
      const res = ok({ id: '1' });
      expect(res.success).toBe(true);
      expect(res.data).toEqual({ id: '1' });
      expect(res.message).toBe('success');
    });

    it('accepts custom message', () => {
      const res = ok(null, 'created');
      expect(res.message).toBe('created');
    });
  });

  describe('fail()', () => {
    it('returns success=false', () => {
      const res = fail('something went wrong');
      expect(res.success).toBe(false);
      expect(res.message).toBe('something went wrong');
      expect(res.data).toBeNull();
    });

    it('carries error data', () => {
      const res = fail('validation error', { field: 'email' });
      expect(res.data).toEqual({ field: 'email' });
    });
  });
});
