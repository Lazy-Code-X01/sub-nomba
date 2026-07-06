import { calculateProration } from '../src/modules/plans/plans.service';

describe('Proration calculation', () => {
  it('returns zero credit when no days remain', () => {
    const result = calculateProration(10_000, 20_000, 0, 30);
    expect(result.creditAmount).toBe(0);
    expect(result.newChargeAmount).toBe(0);
  });

  it('returns full amount when all days remain', () => {
    const result = calculateProration(10_000, 20_000, 30, 30);
    expect(result.creditAmount).toBe(10_000);
    expect(result.newChargeAmount).toBe(20_000);
  });

  it('returns correct proration for mid-cycle upgrade', () => {
    // 15 days remaining of a 30-day cycle
    // old plan: 10,000 > credit: 5,000
    // new plan: 20,000 > charge: 10,000
    const result = calculateProration(10_000, 20_000, 15, 30);
    expect(result.creditAmount).toBe(5_000);
    expect(result.newChargeAmount).toBe(10_000);
  });

  it('handles downgrade correctly', () => {
    const result = calculateProration(20_000, 10_000, 15, 30);
    expect(result.creditAmount).toBe(10_000);
    expect(result.newChargeAmount).toBe(5_000);
  });

  it('rounds amounts correctly', () => {
    // 10 days of 30-day cycle, plan amount = 10_001
    // credit = round(10/30 * 10001) = round(3333.67) = 3334
    const result = calculateProration(10_001, 10_001, 10, 30);
    expect(result.creditAmount).toBe(3334);
    expect(result.newChargeAmount).toBe(3334);
  });

  it('handles annual to monthly downgrade proration', () => {
    // 180 days remaining in 365-day annual plan at 120,000
    const result = calculateProration(120_000, 10_000, 180, 365);
    expect(result.creditAmount).toBe(Math.round((180 / 365) * 120_000));
    expect(result.newChargeAmount).toBe(Math.round((180 / 365) * 10_000));
  });
});
