"use client";

import { CreditCard, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import DetailPanel from "@/components/ui/DetailPanel";
import type { Customer, Subscription } from "@/lib/types";
import { fmt, fmtDate, initials, subStatusBadge } from "@/lib/utils";

interface Props {
  customer: Customer;
  subscription: Subscription | undefined;
  onClose: () => void;
}

export default function CustomerDetailPanel({ customer, subscription: sub, onClose }: Props) {
  const cardLast4 = customer.tokenisedCard ? customer.tokenisedCard.slice(-4) : null;
  const mrr = sub && sub.status === "ACTIVE"
    ? (sub.plan.interval === "ANNUAL" ? Math.round(sub.plan.amount / 12) : sub.plan.amount)
    : 0;

  return (
    <DetailPanel onClose={onClose}>
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-stroke flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow flex items-center justify-center">
            <span className="font-mono font-bold text-[11px] text-[#0C0C0C]">{initials(customer.name)}</span>
          </div>
          <div>
            <p className="font-sans font-semibold text-[14px] text-label leading-none">{customer.name}</p>
            <p className="font-mono text-[10px] text-label-3">{customer.email}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-label-3 hover:text-label transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 px-6 py-5 space-y-6">
        <section>
          <p className="font-mono text-[9px] uppercase tracking-widest text-label-3 mb-3">Subscription</p>
          <div className="bg-surface-2 border border-stroke rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-label-2">Plan</span>
              <span className="font-sans text-[13px] font-medium text-label">{sub?.plan.name ?? "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-label-2">Status</span>
              {sub ? <Badge variant={subStatusBadge(sub.status)} /> : <span className="font-mono text-[11px] text-label-3">No subscription</span>}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-label-2">MRR</span>
              <span className="font-mono text-[13px] font-medium text-yellow">
                {mrr > 0 ? fmt(mrr) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-label-2">Customer since</span>
              <span className="font-mono text-[12px] text-label-2">{fmtDate(customer.createdAt)}</span>
            </div>
          </div>
        </section>

        <section>
          <p className="font-mono text-[9px] uppercase tracking-widest text-label-3 mb-3">Payment Method</p>
          <div className="bg-surface-2 border border-stroke rounded-xl p-4 flex items-center gap-3">
            <CreditCard size={16} className="text-label-3 flex-shrink-0" />
            {cardLast4 ? (
              <div>
                <p className="font-mono text-[13px] text-label">**** **** **** {cardLast4}</p>
                <p className="font-mono text-[10px] text-green mt-0.5">Tokenised · Active</p>
              </div>
            ) : (
              <div>
                <p className="font-sans text-[13px] text-label-2">No card on file</p>
                <p className="font-mono text-[10px] text-label-3 mt-0.5">Customer has not added a payment method</p>
              </div>
            )}
          </div>
        </section>

        {customer.nombaCustomerId && (
          <section>
            <p className="font-mono text-[9px] uppercase tracking-widest text-label-3 mb-3">Nomba Customer</p>
            <div className="bg-surface-2 border border-stroke rounded-xl p-4">
              <p className="font-mono text-[11px] text-label-2 break-all">{customer.nombaCustomerId}</p>
            </div>
          </section>
        )}
      </div>
    </DetailPanel>
  );
}
