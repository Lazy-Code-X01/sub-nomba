import { SubscriptionStatus } from '@prisma/client';
import { transition, canTransition } from '../src/modules/subscriptions/state-machine';
import { AppError } from '../src/middleware/error-handler';

describe('Subscription State Machine', () => {
  describe('valid transitions', () => {
    it('CREATED to TRIALING via START_TRIAL', () => {
      expect(transition(SubscriptionStatus.CREATED, 'START_TRIAL')).toBe(
        SubscriptionStatus.TRIALING
      );
    });

    it('CREATED to ACTIVE via ACTIVATE', () => {
      expect(transition(SubscriptionStatus.CREATED, 'ACTIVATE')).toBe(SubscriptionStatus.ACTIVE);
    });

    it('TRIALING to ACTIVE via ACTIVATE', () => {
      expect(transition(SubscriptionStatus.TRIALING, 'ACTIVATE')).toBe(SubscriptionStatus.ACTIVE);
    });

    it('ACTIVE to PAST_DUE via MARK_PAST_DUE', () => {
      expect(transition(SubscriptionStatus.ACTIVE, 'MARK_PAST_DUE')).toBe(
        SubscriptionStatus.PAST_DUE
      );
    });

    it('ACTIVE to PAUSED via PAUSE', () => {
      expect(transition(SubscriptionStatus.ACTIVE, 'PAUSE')).toBe(SubscriptionStatus.PAUSED);
    });

    it('ACTIVE to CANCELLED via CANCEL', () => {
      expect(transition(SubscriptionStatus.ACTIVE, 'CANCEL')).toBe(SubscriptionStatus.CANCELLED);
    });

    it('PAST_DUE to ACTIVE via ACTIVATE', () => {
      expect(transition(SubscriptionStatus.PAST_DUE, 'ACTIVATE')).toBe(SubscriptionStatus.ACTIVE);
    });

    it('PAST_DUE to CANCELLED via CANCEL', () => {
      expect(transition(SubscriptionStatus.PAST_DUE, 'CANCEL')).toBe(SubscriptionStatus.CANCELLED);
    });

    it('PAUSED to ACTIVE via ACTIVATE', () => {
      expect(transition(SubscriptionStatus.PAUSED, 'ACTIVATE')).toBe(SubscriptionStatus.ACTIVE);
    });

    it('PAUSED to CANCELLED via CANCEL', () => {
      expect(transition(SubscriptionStatus.PAUSED, 'CANCEL')).toBe(SubscriptionStatus.CANCELLED);
    });
  });

  describe('invalid transitions', () => {
    it('throws when transitioning from CANCELLED', () => {
      expect(() => transition(SubscriptionStatus.CANCELLED, 'ACTIVATE')).toThrow(AppError);
    });

    it('throws when applying PAUSE to a PAST_DUE subscription', () => {
      expect(() => transition(SubscriptionStatus.PAST_DUE, 'PAUSE')).toThrow(AppError);
    });

    it('throws on unknown event', () => {
      expect(() => transition(SubscriptionStatus.ACTIVE, 'UNKNOWN' as never)).toThrow(AppError);
    });
  });

  describe('canTransition', () => {
    it('returns true for valid transition', () => {
      expect(canTransition(SubscriptionStatus.ACTIVE, 'CANCEL')).toBe(true);
    });

    it('returns false for invalid transition', () => {
      expect(canTransition(SubscriptionStatus.CANCELLED, 'ACTIVATE')).toBe(false);
    });
  });
});
