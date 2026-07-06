"use client";

import { X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import DetailPanel from "@/components/ui/DetailPanel";
import type { Subscription, Invoice } from "@/lib/types";
import { fmt, fmtDate, subStatusBadge, invStatusBadge } from "@/lib/utils";

interface Props {
  subscription: Subscription;
  invoices: Invoice[];
  invoicesLoading: boolean;
  onClose: () => void;
}

export default function SubscriptionDetailPanel({ subscription: sub, invoices, invoicesLoading, onClose }: Props) {
  return (
    <DetailPanel onClose={onClose}>
      <div className="flex items-center justify-between px-6 h-[60px] border-b border-stroke flex-shrink-0">
        <div>
          <p className="font-sans font-semibold text-[14px] text-label leading-none">{sub.customer.name}</p>
          <p className="font-mono text-[10px] text-label-3">{sub.id}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-label-3 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <Badge variant={subStatusBadge(sub.status)} />
          <span className="font-mono text-[13px] font-medium text-yellow">{fmt(sub.plan.amount)}</span>
        </div>

        <div className="bg-surface-2 border border-stroke rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[12px] text-label-2">Plan</span>
            <span className="font-sans text-[13px] font-medium text-label">{sub.plan.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[12px] text-label-2">Period start</span>
            <span className="font-mono text-[12px] text-label-2">{fmtDate(sub.currentPeriodStart)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[12px] text-label-2">Period end</span>
            <span className="font-mono text-[12px] text-label-2">{fmtDate(sub.currentPeriodEnd)}</span>
          </div>
          {sub.trialEnd && (
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-label-2">Trial ends</span>
              <span className="font-mono text-[12px] text-label-2">{fmtDate(sub.trialEnd)}</span>
            </div>
          )}
          {sub.cancelledAt && (
            <div className="flex items-center justify-between">
              <span className="font-sans text-[12px] text-label-2">Cancelled</span>
              <span className="font-mono text-[12px] text-red">{fmtDate(sub.cancelledAt)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-sans text-[12px] text-label-2">Created</span>
            <span className="font-mono text-[12px] text-label-2">{fmtDate(sub.createdAt)}</span>
          </div>
        </div>

        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-label-3 mb-3">Invoices</p>
          {invoicesLoading ? (
            <p className="font-mono text-[11px] text-label-3">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="font-mono text-[11px] text-label-3">No invoices for this subscription.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-surface-2 border border-stroke rounded-lg">
                  <div>
                    <p className="font-mono text-[11px] text-label">{inv.id}</p>
                    <p className="font-mono text-[10px] text-label-3">{fmtDate(inv.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] font-medium text-label">{fmt(inv.amount)}</span>
                    <Badge variant={invStatusBadge(inv.status)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DetailPanel>
  );
}
