"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Users, TrendingDown, UserCheck, UserX } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { SkeletonTable, ErrorState } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import CustomerDetailPanel from "@/components/customers/CustomerDetailPanel";
import { apiGet, apiPost } from "@/lib/api";
import type { Customer, Subscription } from "@/lib/types";
import { fmtDate, initials, subStatusBadge } from "@/lib/utils";

const COLS    = "grid-cols-[2.5fr_2fr_1.5fr_1fr_1.2fr_48px]";
const HEADERS = ["Customer", "Email", "Plan", "Status", "Since", ""];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subs,      setSubs]      = useState<Subscription[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [selected,  setSelected]  = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ name: "", email: "" });

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiGet<Customer[]>("/api/v1/customers"),
      apiGet<Subscription[]>("/api/v1/subscriptions"),
    ])
      .then(([c, s]) => { setCustomers(c); setSubs(s); })
      .catch(err => setError((err as Error).message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      await apiPost<Customer>("/api/v1/customers", {
        name:  form.name.trim(),
        email: form.email.trim(),
      });
      setShowModal(false);
      setForm({ name: "", email: "" });
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to create customer");
    } finally {
      setSaving(false);
    }
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const total       = customers.length;
  const activeCount = subs.filter(s => s.status === "ACTIVE").length;
  const churned     = subs.filter(s => s.status === "CANCELLED").length;
  const newMonth    = customers.filter(c => new Date(c.createdAt).getTime() > thirtyDaysAgo).length;

  const getCustomerSub = (customerId: string) => subs.find(s => s.customerId === customerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] text-label-3 uppercase tracking-widest">
          {loading ? "-" : `${total} customers total`}
        </p>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus size={12} /> Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Customers" value={loading ? "-" : String(total)}       icon={<Users size={16} />} highlight />
        <StatCard label="Active"          value={loading ? "-" : String(activeCount)} icon={<UserCheck size={16} />} />
        <StatCard label="Churned"         value={loading ? "-" : String(churned)}     icon={<UserX size={16} />} />
        <StatCard label="New This Month"  value={loading ? "-" : String(newMonth)}    icon={<TrendingDown size={16} />} />
      </div>

      <Card title="All Customers" noPadding>
        <div className={`grid ${COLS} gap-4 px-5 py-3 bg-surface-2 border-b border-stroke`}>
          {HEADERS.map((h, i) => (
            <span key={i} className="font-mono text-[10px] uppercase tracking-widest text-label-2">{h}</span>
          ))}
        </div>

        {loading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={28} className="text-label-3 mb-3" />
            <p className="font-sans text-[14px] text-label-2 mb-1">No customers yet</p>
            <p className="font-mono text-[11px] text-label-3">Add your first customer to get started.</p>
          </div>
        ) : (
          customers.map(c => {
            const sub = getCustomerSub(c.id);
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className={`grid ${COLS} gap-4 px-5 py-[14px] hover:bg-surface-2 transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-yellow flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-[11px] text-[#0C0C0C]">{initials(c.name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans text-[13px] font-medium text-label truncate">{c.name}</p>
                    <p className="font-mono text-[10px] text-label-3">{c.id}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[12px] text-label-2 truncate">{c.email}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-sans text-[13px] text-label-2 truncate">{sub?.plan.name ?? "-"}</span>
                </div>
                <div className="flex items-center">
                  {sub ? <Badge variant={subStatusBadge(sub.status)} /> : <span className="font-mono text-[10px] text-label-3">-</span>}
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[12px] text-label-2">{fmtDate(c.createdAt)}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-border-2" />
                </div>
              </div>
            );
          })
        )}
      </Card>

      {selected && (
        <CustomerDetailPanel
          customer={selected}
          subscription={getCustomerSub(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {showModal && (
        <Modal title="Add Customer" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">Full Name</span>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-surface-2 border border-stroke rounded-lg px-3 py-2.5 font-sans text-[13px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow"
                placeholder="e.g. Emeka Okafor"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-surface-2 border border-stroke rounded-lg px-3 py-2.5 font-mono text-[13px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow"
                placeholder="emeka@example.com"
              />
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              {saving ? "Adding..." : "Add Customer"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
