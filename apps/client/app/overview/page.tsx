"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, RefreshCcw, AlertCircle, DollarSign } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import RevenueChart, { type ChartPoint } from "@/components/overview/RevenueChart";
import { SkeletonTable, ErrorState } from "@/components/ui/Skeleton";
import { apiGet } from "@/lib/api";
import type { Subscription, Invoice, Customer } from "@/lib/types";
import { fmt, fmtDate, invStatusBadge, initials } from "@/lib/utils";

function buildChartData(invoices: Invoice[]): ChartPoint[] {
  const map = new Map<string, { revenue: number; refunds: number }>();
  const sorted = [...invoices].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  for (const inv of sorted) {
    const label = new Date(inv.createdAt).toLocaleDateString("en-NG", {
      month: "short", day: "numeric",
    });
    const entry = map.get(label) ?? { revenue: 0, refunds: 0 };
    if (inv.status === "PAID")  entry.revenue += inv.amount;
    if (inv.status === "VOID")  entry.refunds += inv.amount;
    map.set(label, entry);
  }
  return Array.from(map.entries())
    .slice(-10)
    .map(([label, vals]) => ({ label, ...vals }));
}

export default function OverviewPage() {
  const [subs,      setSubs]      = useState<Subscription[]>([]);
  const [invoices,  setInvoices]  = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      apiGet<Subscription[]>("/api/v1/subscriptions"),
      apiGet<Invoice[]>("/api/v1/invoices"),
      apiGet<Customer[]>("/api/v1/customers"),
    ])
      .then(([s, i, c]) => { setSubs(s); setInvoices(i); setCustomers(c); })
      .catch(err => setError((err as Error).message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeSubs = subs.filter(s => s.status === "ACTIVE");

  const mrr = activeSubs.reduce((sum, s) => {
    const a = s.plan.amount;
    if (s.plan.interval === "ANNUAL")  return sum + Math.round(a / 12);
    if (s.plan.interval === "CUSTOM")  return sum + Math.round(a / Math.max(s.plan.intervalCount, 1));
    return sum + a;
  }, 0);

  const newCustomers  = customers.filter(c => new Date(c.createdAt).getTime() > thirtyDaysAgo).length;
  const cancelledSubs = subs.filter(s => s.status === "CANCELLED").length;
  const churnRate     = subs.length > 0 ? ((cancelledSubs / subs.length) * 100).toFixed(1) : "0.0";

  const customerMap     = new Map(customers.map(c => [c.id, c]));
  const subscriptionMap = new Map(subs.map(s => [s.id, s]));

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const chartData = buildChartData(invoices);

  const stats = [
    { label: "Monthly Recurring Revenue", value: fmt(mrr),                    icon: <DollarSign size={16} />, highlight: true },
    { label: "Active Subscriptions",       value: String(activeSubs.length),    icon: <RefreshCcw size={16} /> },
    { label: "New Customers (30d)",         value: String(newCustomers),          icon: <Users size={16} /> },
    { label: "Churn Rate",                  value: `${churnRate}%`,               icon: <AlertCircle size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card title="Revenue" noPadding>
        <RevenueChart data={chartData} />
      </Card>

      <Card title="Recent Invoices" noPadding>
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-surface-2 border-b border-stroke">
          {["Customer", "Plan", "Status", "Date", "Amount"].map(h => (
            <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-label-2">{h}</span>
          ))}
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : recentInvoices.length === 0 ? (
          <div className="flex items-center justify-center py-14">
            <p className="font-mono text-[12px] text-label-3">No invoices yet.</p>
          </div>
        ) : (
          recentInvoices.map(inv => {
            const customer  = customerMap.get(inv.customerId);
            const sub       = subscriptionMap.get(inv.subscriptionId);
            const name      = customer?.name ?? "Unknown";
            const planName  = sub?.plan.name ?? "—";
            const isNeg     = inv.status === "FAILED";
            return (
              <div
                key={inv.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 px-5 py-[14px] hover:bg-surface-2 transition-colors cursor-default"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-surface-2 border border-stroke flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-[10px] text-label-2">{initials(name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans text-[13px] font-medium text-label truncate">{name}</p>
                    <p className="font-mono text-[10px] text-label-3">{inv.id}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="font-sans text-[13px] text-label-2 truncate">{planName}</span>
                </div>
                <div className="flex items-center">
                  <Badge variant={invStatusBadge(inv.status)} />
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[12px] text-label-2">{fmtDate(inv.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <span className={`font-mono text-[13px] font-medium ${isNeg ? "text-red" : "text-label"}`}>
                    {isNeg ? "-" : ""}{fmt(inv.amount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
