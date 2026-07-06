import type { SubscriptionStatus, InvoiceStatus, WebhookEventStatus } from "./types";

export type BadgeVariant =
  | "active" | "trial" | "past-due" | "paused" | "cancelled"
  | "paid" | "failed" | "pending";

export function fmt(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map(w => w[0] ?? "")
    .join("")
    .toUpperCase();
}

export function subStatusBadge(status: SubscriptionStatus): BadgeVariant {
  const map: Record<SubscriptionStatus, BadgeVariant> = {
    CREATED:   "trial",
    TRIALING:  "trial",
    ACTIVE:    "active",
    PAST_DUE:  "past-due",
    PAUSED:    "paused",
    CANCELLED: "cancelled",
  };
  return map[status] ?? "pending";
}

export function invStatusBadge(status: InvoiceStatus): BadgeVariant {
  const map: Record<InvoiceStatus, BadgeVariant> = {
    PENDING: "pending",
    PAID:    "paid",
    FAILED:  "failed",
    VOID:    "cancelled",
  };
  return map[status] ?? "pending";
}

export function webhookStatusBadge(status: WebhookEventStatus): BadgeVariant {
  const map: Record<WebhookEventStatus, BadgeVariant> = {
    PENDING:   "pending",
    DELIVERED: "active",
    FAILED:    "failed",
  };
  return map[status] ?? "pending";
}

export function intervalLabel(interval: string): string {
  return (
    ({ MONTHLY: "Monthly", ANNUAL: "Annual", CUSTOM: "Custom" } as Record<string, string>)[interval]
    ?? interval
  );
}
