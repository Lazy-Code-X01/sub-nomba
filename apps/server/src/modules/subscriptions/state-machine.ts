import { SubscriptionStatus } from '@prisma/client';
import { AppError } from '../../middleware/error-handler';

type Transition = {
  from: SubscriptionStatus[];
  to: SubscriptionStatus;
};

const TRANSITIONS: Record<string, Transition> = {
  START_TRIAL: {
    from: [SubscriptionStatus.CREATED],
    to: SubscriptionStatus.TRIALING,
  },
  ACTIVATE: {
    from: [SubscriptionStatus.CREATED, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE, SubscriptionStatus.PAUSED],
    to: SubscriptionStatus.ACTIVE,
  },
  MARK_PAST_DUE: {
    from: [SubscriptionStatus.ACTIVE],
    to: SubscriptionStatus.PAST_DUE,
  },
  PAUSE: {
    from: [SubscriptionStatus.ACTIVE],
    to: SubscriptionStatus.PAUSED,
  },
  CANCEL: {
    from: [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.PAST_DUE,
      SubscriptionStatus.PAUSED,
      SubscriptionStatus.TRIALING,
    ],
    to: SubscriptionStatus.CANCELLED,
  },
};

export function transition(
  current: SubscriptionStatus,
  event: keyof typeof TRANSITIONS,
): SubscriptionStatus {
  const rule = TRANSITIONS[event];
  if (!rule) throw new AppError(400, `Unknown transition event: ${event}`);
  if (!rule.from.includes(current)) {
    throw new AppError(
      409,
      `Cannot apply ${event}: subscription is ${current}, expected one of [${rule.from.join(', ')}]`,
    );
  }
  return rule.to;
}

export function canTransition(
  current: SubscriptionStatus,
  event: keyof typeof TRANSITIONS,
): boolean {
  const rule = TRANSITIONS[event];
  return !!rule && rule.from.includes(current);
}
