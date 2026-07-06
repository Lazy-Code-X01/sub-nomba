"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, RefreshCcw, X, TrendingUp } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonTable, ErrorState } from "@/components/ui/Skeleton";
import { apiGet } from "@/lib/api";
import type { Invoice, Customer } from "@/lib/types";
import { fmt, fmtDate, initials } from "@/lib/utils";

const COLS    = "grid-cols-[2fr_1fr_1.5fr_1.2fr_auto]";
const HEADERS = ["Customer", "Amount", "Invoice", "Due Date", "Actions"];

function daysOverdue(dueDate: string): number {
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function overdueColor(days: number): string {
  if (days >= 14) return "text-red";
  if (days >= 7)  return "text-[#F97316]";
  return "text-amber";
}

export default function DunningPage() {
  const [invoices,   setInvoices]   = useState<Invoice[]>([]);
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [dismissed,  setDismissed]  = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiGet<Invoice[]>("/api/v1/invoices"),
      apiGet<Customer[]>("/api/v1/customers"),
    ])
      .then(([i, c]) => { setInvoices(i); setCustomers(c); })
      .catch(err => setError((err as Error).message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const customerMap = new Map(customers.map(c => [c.id, c]));

  const failedInvoices = invoices
    .filter(inv => inv.status === "FAILED" && !dismissed.has(inv.id))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const totalAtRisk  = failedInvoices.reduce((s, i) => s + i.amount, 0);
  const recovered    = invoices.filter(i => i.status === "PAID" && i.paidAt).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total at Risk"   value={loading ? "—" : fmt(totalAtRisk)}           icon={<AlertTriangle size={16} />} highlight />
        <StatCard label="Active Dunning"  value={loading ? "—" : String(failedInvoices.length)} icon={<RefreshCcw size={16} />} />
        <StatCard label="Paid Invoices"   value={loading ? "—" : String(recovered)}           icon={<TrendingUp size={16} />} />
      </div>

      <Card title="Dunning Queue" noPadding>
        <div className={`grid ${COLS} gap-4 px-5 py-3 bg-surface-2 border-b border-stroke`}>
          {HEADERS.map(h => (
            <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-label-2">{h}</span>
          ))}
        </div>

        {loading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : failedInvoices.length === 0 ? (
          <div className="flex items-center justify-center py-14">
            <p className="font-mono text-[12px] text-label-3">No active dunning items.</p>
          </div>
        ) : (
          failedInvoices.map(inv => {
            const customer = customerMap.get(inv.customerId);
            const name     = customer?.name ?? inv.customerId;
            const days     = daysOverdue(inv.dueDate);
            return (
              <div key={inv.id} className={`grid ${COLS} gap-4 px-5 py-[14px] hover:bg-surface-2 transition-colors`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-[10px] text-label-2">{initials(name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans text-[13px] font-medium text-label truncate">{name}</p>
                    <p className={`font-mono text-[10px] font-medium ${overdueColor(days)}`}>
                      {days}d overdue
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="font-mono text-[13px] font-medium text-label">{fmt(inv.amount)}</span>
                </div>

                <div className="flex items-center min-w-0">
                  <div>
                    <p className="font-mono text-[11px] text-label">{inv.id}</p>
                    <p className="font-mono text-[10px] text-red">FAILED</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="font-mono text-[12px] text-label-2">{fmtDate(inv.dueDate)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm">
                    <RefreshCcw size={11} /> Retry
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDismissed(p => { const s = new Set(p); s.add(inv.id); return s; })}
                  >
                    <X size={11} /> Dismiss
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
