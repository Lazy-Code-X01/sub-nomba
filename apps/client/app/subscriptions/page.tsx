"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, XCircle, RefreshCcw, Clock, Plus, Play, Receipt } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonTable, ErrorState } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import SubscriptionDetailPanel from "@/components/subscriptions/SubscriptionDetailPanel";
import NewSubscriptionModal from "@/components/subscriptions/NewSubscriptionModal";
import { apiGet, apiPost } from "@/lib/api";
import type { Subscription, Invoice, Customer, Plan } from "@/lib/types";
import { fmt, fmtDate, subStatusBadge, initials } from "@/lib/utils";

const TABS = ["All", "Active", "Trialing", "Past Due", "Paused", "Cancelled"] as const;
type Tab   = typeof TABS[number];

const STATUS_PARAM: Record<Tab, string | undefined> = {
  "All":       undefined,
  "Active":    "ACTIVE",
  "Trialing":  "TRIALING",
  "Past Due":  "PAST_DUE",
  "Paused":    "PAUSED",
  "Cancelled": "CANCELLED",
};

const COLS    = "grid-cols-[2fr_1.5fr_1fr_1.5fr_1.5fr_1fr_88px]";
const HEADERS = ["Customer", "Plan", "Status", "Current Period", "Next Billing", "Amount", "Actions"];

function nextBilling(sub: Subscription): string {
  if (sub.status === "CANCELLED") return "—";
  if (sub.status === "PAUSED")    return "On resume";
  if (sub.status === "PAST_DUE")  return "Retrying";
  return fmtDate(sub.currentPeriodEnd);
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subs,       setSubs]       = useState<Subscription[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [tab,        setTab]        = useState<Tab>("All");
  const [selected,   setSelected]   = useState<Subscription | null>(null);
  const [subInvs,    setSubInvs]    = useState<Invoice[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [actioning,  setActioning]  = useState<string | null>(null);

  const [showNew,        setShowNew]        = useState(false);
  const [modalCustomers, setModalCustomers] = useState<Customer[]>([]);
  const [modalPlans,     setModalPlans]     = useState<Plan[]>([]);
  const [modalLoading,   setModalLoading]   = useState(false);
  const [newForm,        setNewForm]        = useState({ customerId: "", planId: "" });
  const [creating,       setCreating]       = useState(false);

  const load = useCallback((status?: string) => {
    setLoading(true);
    setError(null);
    const params = status ? { status } : undefined;
    apiGet<Subscription[]>("/api/v1/subscriptions", params)
      .then(setSubs)
      .catch(err => setError((err as Error).message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(STATUS_PARAM[tab]); }, [tab, load]);

  useEffect(() => {
    if (!selected) { setSubInvs([]); return; }
    setInvLoading(true);
    apiGet<Invoice[]>("/api/v1/invoices", { subscriptionId: selected.id })
      .then(setSubInvs)
      .catch(() => setSubInvs([]))
      .finally(() => setInvLoading(false));
  }, [selected]);

  async function openNew() {
    setShowNew(true);
    setModalLoading(true);
    try {
      const [customers, plans] = await Promise.all([
        apiGet<Customer[]>("/api/v1/customers"),
        apiGet<Plan[]>("/api/v1/plans"),
      ]);
      const activePlans = plans.filter(p => p.isActive);
      setModalCustomers(customers);
      setModalPlans(activePlans);
      setNewForm({ customerId: customers[0]?.id ?? "", planId: activePlans[0]?.id ?? "" });
    } catch {
      setShowNew(false);
    } finally {
      setModalLoading(false);
    }
  }

  async function handleCreate() {
    if (!newForm.customerId || !newForm.planId) return;
    setCreating(true);
    try {
      await apiPost<Subscription>("/api/v1/subscriptions", newForm);
      setShowNew(false);
      setNewForm({ customerId: "", planId: "" });
      setTab("All");
      load(undefined);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to create subscription");
    } finally {
      setCreating(false);
    }
  }

  async function handleAction(id: string, action: "pause" | "resume" | "cancel") {
    setActioning(id);
    try {
      await apiPost(`/api/v1/subscriptions/${id}/${action}`);
      load(STATUS_PARAM[tab]);
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error((err as Error).message ?? `Failed to ${action} subscription`);
    } finally {
      setActioning(null);
    }
  }

  async function handleBillNow(id: string) {
    setActioning(id);
    try {
      await apiPost(`/api/v1/subscriptions/${id}/bill-now`);
      router.push("/invoices");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to generate invoice");
      setActioning(null);
    }
  }

  const counts = {
    active:    subs.filter(s => s.status === "ACTIVE").length,
    trialing:  subs.filter(s => s.status === "TRIALING" || s.status === "CREATED").length,
    pastDue:   subs.filter(s => s.status === "PAST_DUE").length,
    paused:    subs.filter(s => s.status === "PAUSED").length,
    cancelled: subs.filter(s => s.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-surface-2 border border-stroke">
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
        <Button variant="primary" size="sm" onClick={openNew}>
          <Plus size={12} /> New Subscription
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Active"    value={loading ? "—" : String(counts.active)}    icon={<RefreshCcw size={16} />} highlight />
        <StatCard label="Trialing"  value={loading ? "—" : String(counts.trialing)}  icon={<Clock size={16} />} />
        <StatCard label="Past Due"  value={loading ? "—" : String(counts.pastDue)}   icon={<XCircle size={16} />} />
        <StatCard label="Paused"    value={loading ? "—" : String(counts.paused)}    icon={<PauseCircle size={16} />} />
        <StatCard label="Cancelled" value={loading ? "—" : String(counts.cancelled)} icon={<XCircle size={16} />} />
      </div>

      <Card title="Subscriptions" noPadding>
        <div className={`grid ${COLS} gap-4 px-5 py-3 bg-surface-2 border-b border-stroke`}>
          {HEADERS.map(h => (
            <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-label-2">{h}</span>
          ))}
        </div>

        {loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(STATUS_PARAM[tab])} />
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-sans text-[14px] text-label-2 mb-1">No subscriptions</p>
            <p className="font-mono text-[11px] text-label-3">Create one to get started.</p>
          </div>
        ) : (
          subs.map(sub => {
            const canPause  = sub.status === "ACTIVE" || sub.status === "TRIALING" || sub.status === "CREATED";
            const canResume = sub.status === "PAUSED";
            const canCancel = sub.status !== "CANCELLED";
            const canBill   = sub.status !== "CANCELLED";
            const busy      = actioning === sub.id;

            return (
              <div
                key={sub.id}
                onClick={() => setSelected(sub)}
                className={`grid ${COLS} gap-4 px-5 py-[14px] hover:bg-surface-2 transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-[10px] text-label-2">{initials(sub.customer.name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans text-[13px] font-medium text-label truncate">{sub.customer.name}</p>
                    <p className="font-mono text-[10px] text-label-3">{sub.id.slice(0, 8)}…</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="font-sans text-[13px] text-label-2 truncate">{sub.plan.name}</span>
                </div>
                <div className="flex items-center">
                  <Badge variant={subStatusBadge(sub.status)} />
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[11px] text-label-2">
                    {fmtDate(sub.currentPeriodStart)} – {fmtDate(sub.currentPeriodEnd)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[12px] text-label-2">{nextBilling(sub)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[13px] font-medium text-label">{fmt(sub.plan.amount)}</span>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  {canBill && (
                    <button onClick={() => handleBillNow(sub.id)} disabled={busy} className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-yellow disabled:opacity-40 transition-colors" title="Generate invoice now">
                      <Receipt size={13} />
                    </button>
                  )}
                  {canPause && (
                    <button onClick={() => handleAction(sub.id, "pause")} disabled={busy} className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-amber disabled:opacity-40 transition-colors" title="Pause">
                      <PauseCircle size={13} />
                    </button>
                  )}
                  {canResume && (
                    <button onClick={() => handleAction(sub.id, "resume")} disabled={busy} className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-green disabled:opacity-40 transition-colors" title="Resume">
                      <Play size={13} />
                    </button>
                  )}
                  {canCancel && (
                    <button onClick={() => handleAction(sub.id, "cancel")} disabled={busy} className="p-1.5 rounded-lg hover:bg-surface-3 text-label-3 hover:text-red disabled:opacity-40 transition-colors" title="Cancel">
                      <XCircle size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {selected && (
        <SubscriptionDetailPanel
          subscription={selected}
          invoices={subInvs}
          invoicesLoading={invLoading}
          onClose={() => setSelected(null)}
        />
      )}

      {showNew && (
        <NewSubscriptionModal
          customers={modalCustomers}
          plans={modalPlans}
          loading={modalLoading}
          form={newForm}
          onChange={setNewForm}
          creating={creating}
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
