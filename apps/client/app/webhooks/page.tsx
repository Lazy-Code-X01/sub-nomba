"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, ChevronDown, ChevronRight } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { SkeletonTable, ErrorState } from "@/components/ui/Skeleton";
import { apiGet } from "@/lib/api";
import type { WebhookEvent, WebhookEventStatus } from "@/lib/types";
import { fmtDateTime, webhookStatusBadge } from "@/lib/utils";

const TABS = ["All", "Delivered", "Failed", "Pending"] as const;
type Tab   = typeof TABS[number];

const STATUS_FILTER: Record<Tab, WebhookEventStatus | null> = {
  "All": null, "Delivered": "DELIVERED", "Failed": "FAILED", "Pending": "PENDING",
};

const COLS    = "grid-cols-[2fr_1fr_0.7fr_1.8fr_1.8fr_36px]";
const HEADERS = ["Event Type", "Status", "Attempts", "Last Attempt", "Next Retry", ""];

export default function WebhooksPage() {
  const [events,   setEvents]   = useState<WebhookEvent[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<Tab>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<WebhookEvent[]>("/api/v1/webhook-events")
      .then(setEvents)
      .catch(err => setError((err as Error).message ?? "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = STATUS_FILTER[tab] === null
    ? events
    : events.filter(e => e.status === STATUS_FILTER[tab]);

  const delivered   = events.filter(e => e.status === "DELIVERED").length;
  const failed      = events.filter(e => e.status === "FAILED").length;
  const pending     = events.filter(e => e.status === "PENDING").length;
  const successRate = events.length > 0
    ? Math.round((delivered / events.length) * 100)
    : 0;

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
        <StatCard label="Delivered"    value={loading ? "-" : String(delivered)}      icon={<Zap size={16} />} highlight />
        <StatCard label="Failed"       value={loading ? "-" : String(failed)}         icon={<Zap size={16} />} />
        <StatCard label="Pending"      value={loading ? "-" : String(pending)}        icon={<Zap size={16} />} />
        <StatCard label="Success Rate" value={loading ? "-" : `${successRate}%`}      icon={<Zap size={16} />} />
      </div>

      <Card title="Webhook Log" noPadding>
        <div className={`grid ${COLS} gap-3 px-5 py-3 bg-surface-2 border-b border-stroke`}>
          {HEADERS.map((h, i) => (
            <span key={i} className="font-mono text-[10px] uppercase tracking-widest text-label-2">{h}</span>
          ))}
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-14">
            <p className="font-mono text-[12px] text-label-3">No webhook events found.</p>
          </div>
        ) : (
          filtered.map(ev => (
            <div key={ev.id}>
              <div
                className={`grid ${COLS} gap-3 px-5 py-[14px] hover:bg-surface-2 transition-colors cursor-pointer`}
                onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
              >
                <div className="flex items-center min-w-0">
                  <span className="font-mono text-[12px] text-label truncate">{ev.eventType}</span>
                </div>
                <div className="flex items-center">
                  <Badge
                    variant={webhookStatusBadge(ev.status)}
                    label={ev.status === "DELIVERED" ? "Delivered" : ev.status === "FAILED" ? "Failed" : "Pending"}
                  />
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[12px] text-label-2">{ev.attempts}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[11px] text-label-2">{fmtDateTime(ev.lastAttemptAt)}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-mono text-[11px] text-label-2">{fmtDateTime(ev.nextRetryAt)}</span>
                </div>
                <div className="flex items-center justify-center text-label-3">
                  {expanded === ev.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>

              {expanded === ev.id && (
                <div className="px-5 pb-4">
                  <div className="rounded-xl bg-canvas border border-stroke overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stroke">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-label-3">Payload</span>
                      <span className="ml-auto font-mono text-[10px] text-label-3">{ev.id}</span>
                    </div>
                    <pre className="px-4 py-4 font-mono text-[11px] text-label-2 overflow-x-auto leading-relaxed">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
