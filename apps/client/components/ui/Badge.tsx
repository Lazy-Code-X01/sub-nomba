import React from "react";

type BadgeVariant =
  | "active"
  | "trial"
  | "past-due"
  | "paused"
  | "cancelled"
  | "paid"
  | "failed"
  | "pending";

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
  label?: string;
}

const variantConfig: Record<
  BadgeVariant,
  { dot: string; bg: string; text: string; defaultLabel: string }
> = {
  active: {
    dot: "bg-green",
    bg: "bg-green-dim",
    text: "text-green",
    defaultLabel: "Active",
  },
  trial: {
    dot: "bg-blue",
    bg: "bg-blue-dim",
    text: "text-blue",
    defaultLabel: "Trialing",
  },
  "past-due": {
    dot: "bg-red",
    bg: "bg-red-dim",
    text: "text-red",
    defaultLabel: "Past Due",
  },
  paused: {
    dot: "bg-amber",
    bg: "bg-amber-dim",
    text: "text-amber",
    defaultLabel: "Paused",
  },
  cancelled: {
    dot: "bg-label-3",
    bg: "bg-surface-2",
    text: "text-label-2",
    defaultLabel: "Cancelled",
  },
  paid: {
    dot: "bg-green",
    bg: "bg-green-dim",
    text: "text-green",
    defaultLabel: "Paid",
  },
  failed: {
    dot: "bg-red",
    bg: "bg-red-dim",
    text: "text-red",
    defaultLabel: "Failed",
  },
  pending: {
    dot: "bg-amber",
    bg: "bg-amber-dim",
    text: "text-amber",
    defaultLabel: "Pending",
  },
};

export default function Badge({ variant, children, label }: BadgeProps) {
  const cfg = variantConfig[variant];
  const displayLabel = children ?? label ?? cfg.defaultLabel;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md ${cfg.bg}`}>
      <span className={`font-mono text-[10px] font-medium ${cfg.text}`}>
        {displayLabel}
      </span>
    </span>
  );
}
