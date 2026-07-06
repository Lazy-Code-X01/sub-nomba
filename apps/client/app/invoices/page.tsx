"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Eye, RefreshCcw, Link2, CheckCircle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { SkeletonTable, ErrorState } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import PaymentLinkModal from "@/components/invoices/PaymentLinkModal";
import { apiGet, apiPost } from "@/lib/api";
import type { Invoice, Customer, InvoiceStatus } from "@/lib/types";
import { fmt, fmtDate, invStatusBadge, initials } from "@/lib/utils";

const TABS = ["All", "Paid", "Failed", "Pending", "Void"] as const;
type Tab   = typeof TABS[number];

const STATUS_FILTER: Record<Tab, InvoiceStatus | null> = {
  "All": null, "Paid": "PAID", "Failed": "FAILED", "Pending": "PENDING", "Void": "VOID",
};

const COLS    = "grid-cols-[1.1fr_1.8fr_1fr_0.9fr_1.1fr_1.1fr_1.4fr_72px]";
const HEADERS = ["Invoice ID", "Customer", "Amount", "Status", "Due Date", "Paid At", "Nomba Ref", ""];

export default function InvoicesPage() {
  const [invoices,  setInvoices]  = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [tab,       setTab]       = useState<Tab>("All");

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutResult,  setCheckoutResult]  = useState<Record<string, unknown> | null>(null);
  const [markingPaid,     setMarkingPaid]     = useState<string | null>(null);

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

  async function handleCheckout(invId: string) {
    setCheckoutLoading(invId);
    try {
      const result = await apiPost<Record<string, unknown>>(`/api/v1/invoices/${invId}/checkout`);
      setCheckoutResult(result);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to generate payment link");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleMarkPaid(invId: string) {
    setMarkingPaid(invId);
    try {
      await apiPost(`/api/v1/invoices/${invId}/mark-paid`);
      load();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to mark invoice as paid");
    } finally {
      setMarkingPaid(null);
    }
  }

  const customerMap = new Map(customers.map(c => [c.id, c]));

  const filtered = STATUS_FILTER[tab] === null
    ? invoices
    : invoices.filter(inv => inv.status === STATUS_FILTER[tab]);

  const paid    = invoices.filter(i => i.status === "PAID");
  const failed  = invoices.filter(i => i.status === "FAILED").length;
  const pending = invoices.filter(i => i.status === "PENDING").length;
  const paidAmt = paid.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-0.5 p-1 rounded-lg bg-surface-2 border border-stroke w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md font-mono text-[11px] transition-colors ${tab === t ? "bg-surface-3 text-label" : "text-label-2 hover:text-label"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={loading ? "—" : fmt(paidAmt)}          icon={<FileText size={16} />} highlight />
        <StatCard label="Paid"            value={loading ? "—" : String(paid.length)}   icon={<FileText size={16} />} />
        <StatCard label="Failed"          value={loading ? "—" : String(failed)}        icon={<FileText size={16} />} />
        <StatCard label="Pending"         value={loading ? "—" : String(pending)}       icon={<FileText size={16} />} />
      </div>

      <Card title="Invoices" noPadding>
        <div className="overflow-x-auto">
          <div className={`grid ${COLS} gap-3 px-5 py-3 bg-surface-2 border-b border-stroke min-w-[960px]`}>
            {HEADERS.map((h, i) => (
              <span key={i} className="font-mono text-[10px] uppercase tracking-widest text-label-2">{h}</span>
            ))}
          </div>

          {loading ? (
            <SkeletonTable rows={6} cols={8} />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-14">
              <p className="font-mono text-[12px] text-label-3">No invoices found.</p>
            </div>
          ) : (
            filtered.map(inv => {
              const customer  = customerMap.get(inv.customerId);
              const name      = customer?.name ?? inv.customerId.slice(0, 8) + "…";
              const ref       = inv.nombaChargeRef ?? inv.nombaOrderRef;
              const isLoading = checkoutLoading === inv.id;
              const isMarking = markingPaid === inv.id;

              return (
                <div key={inv.id} className={`grid ${COLS} gap-3 px-5 py-[14px] hover:bg-surface-2 transition-colors cursor-default min-w-[960px]`}>
                  <div className="flex items-center min-w-0 overflow-hidden">
                    <span className="font-mono text-[12px] text-label truncate">{inv.id.slice(0, 12)}…</span>
                  </div>
                  <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                    <div className="w-6 h-6 rounded-md bg-surface-3 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[9px] text-label-2">{initials(name)}</span>
                    </div>
                    <span className="font-sans text-[13px] text-label truncate">{name}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="font-mono text-[13px] font-medium text-label">{fmt(inv.amount)}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <Badge variant={invStatusBadge(inv.status)} />
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="font-mono text-[12px] text-label-2">{fmtDate(inv.dueDate)}</span>
                  </div>
                  <div className="flex items-center min-w-0">
                    <span className="font-mono text-[12px] text-label-2">{fmtDate(inv.paidAt)}</span>
                  </div>
                  <div className="flex items-center min-w-0 overflow-hidden">
                    <span className="font-mono text-[11px] text-label-3 truncate">{ref ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-label transition-colors" title="View">
                      <Eye size={13} />
                    </button>
                    {inv.status === "PENDING" && (<>
                      <button
                        onClick={() => handleCheckout(inv.id)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-yellow disabled:opacity-40 transition-colors"
                        title="Get payment link"
                      >
                        {isLoading ? <RefreshCcw size={13} className="animate-spin" /> : <Link2 size={13} />}
                      </button>
                      <button
                        onClick={() => handleMarkPaid(inv.id)}
                        disabled={isMarking}
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-green-400 disabled:opacity-40 transition-colors"
                        title="Mark as paid"
                      >
                        {isMarking ? <RefreshCcw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      </button>
                    </>)}
                    {inv.status === "FAILED" && (
                      <button className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-yellow transition-colors" title="Retry charge">
                        <RefreshCcw size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {checkoutResult && (
        <PaymentLinkModal result={checkoutResult} onClose={() => setCheckoutResult(null)} />
      )}
    </div>
  );
}
