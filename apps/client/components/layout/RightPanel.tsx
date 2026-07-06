import { AlertTriangle, Zap } from "lucide-react";

const dunningItems = [
  { id: "inv_7f3a", customer: "NovaTech Ltd", amount: "₦24,000", attempt: 2 },
  { id: "inv_2c9e", customer: "Kola Fashions", amount: "₦8,500", attempt: 1 },
];

const webhookLog = [
  { event: "subscription.activated", status: "delivered", ago: "2m ago" },
  { event: "invoice.paid", status: "delivered", ago: "8m ago" },
  { event: "dunning.recovered", status: "delivered", ago: "23m ago" },
  { event: "subscription.past_due", status: "failed", ago: "1h ago" },
];

export default function RightPanel() {
  return (
    <aside className="fixed right-0 top-0 w-[300px] h-full bg-surface border-l border-stroke flex flex-col z-20 overflow-y-auto">
      {/* Dunning queue */}
      <section className="p-5 border-b border-stroke">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} className="text-amber" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-label-2">
              Dunning Queue
            </span>
          </div>
          <span className="font-mono text-[9px] bg-red text-white px-1.5 py-0.5 rounded-md">
            {dunningItems.length}
          </span>
        </div>
        <div className="space-y-2">
          {dunningItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-stroke"
            >
              <div>
                <p className="font-sans text-[12px] font-medium text-label leading-none mb-1">
                  {item.customer}
                </p>
                <p className="font-mono text-[10px] text-label-3">
                  Attempt {item.attempt} · {item.id}
                </p>
              </div>
              <span className="font-mono text-[11px] font-medium text-red">
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Webhook log */}
      <section className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={12} className="text-blue" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-label-2">
            Webhook Log
          </span>
        </div>
        <div className="space-y-1">
          {webhookLog.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-stroke/50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    entry.status === "delivered" ? "bg-green" : "bg-red"
                  }`}
                />
                <span className="font-mono text-[10px] text-label-2 truncate">
                  {entry.event}
                </span>
              </div>
              <span className="font-mono text-[9px] text-label-3 flex-shrink-0 ml-2">
                {entry.ago}
              </span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
