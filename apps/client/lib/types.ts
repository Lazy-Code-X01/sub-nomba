export type PlanInterval = "MONTHLY" | "ANNUAL" | "CUSTOM";
export type SubscriptionStatus = "CREATED" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED";
export type InvoiceStatus = "PENDING" | "PAID" | "FAILED" | "VOID";
export type WebhookEventStatus = "PENDING" | "DELIVERED" | "FAILED";

export interface Plan {
  id: string;
  tenantId: string;
  name: string;
  amount: number;
  currency: string;
  interval: PlanInterval;
  intervalCount: number;
  trialDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  nombaCustomerId: string | null;
  tokenisedCard: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  pausedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  plan: Plan;
}

export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  nombaOrderRef: string | null;
  nombaChargeRef: string | null;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  tenantId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: WebhookEventStatus;
  attempts: number;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  createdAt: string;
}
