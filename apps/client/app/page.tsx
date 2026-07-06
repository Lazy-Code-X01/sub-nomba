import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, RefreshCcw, Shield, Bell, Code2, GitBranch, Check } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Feature { icon: LucideIcon; title: string; desc: string; }

const STEPS = [
  {
    title: "Create a plan",
    desc: "Define pricing in 30 seconds — monthly, annual, or custom billing intervals with optional trial days.",
  },
  {
    title: "Subscribe a customer",
    desc: "Link a customer to a plan. Sub handles the full state machine: TRIALING → ACTIVE → PAST_DUE automatically.",
  },
  {
    title: "Revenue on autopilot",
    desc: "At period end, Sub charges via Nomba, retries failures, fires webhooks, and keeps your MRR dashboard current.",
  },
];

const FEATURES: Feature[] = [
  { icon: RefreshCcw, title: "Recurring billing",  desc: "BullMQ-powered worker fires at period end. No cron jobs, no missed charges." },
  { icon: Bell,       title: "Smart dunning",      desc: "Failed charges queue for retry with exponential backoff. Revenue recovery on autopilot." },
  { icon: Zap,        title: "Nomba native",        desc: "Checkout links, card tokenisation, and webhook verification all built in." },
  { icon: GitBranch,  title: "Webhook events",     desc: "Every state change fires a signed webhook — payment.succeeded, subscription.cancelled, and more." },
  { icon: Code2,      title: "REST API",            desc: "Clean endpoints with idempotency keys, API-key auth, and structured error responses." },
  { icon: Shield,     title: "Audit trail",         desc: "Every invoice, attempt, and event — logged and queryable. Sleep well on-call." },
];

const METRICS = [
  { value: "< 2min", label: "Time to first invoice" },
  { value: "6",      label: "Subscription states" },
  { value: "3×",     label: "Retry attempts" },
  { value: "100%",   label: "Nomba native" },
];

const CHECKLIST = [
  "Plans, customers, subscriptions via REST",
  "Signed webhook events for every state change",
  "Nomba checkout links for manual collection",
  "Dunning queue with automatic retries",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas font-sans antialiased">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-8 bg-canvas border-b border-stroke">
        <div className="flex items-center gap-2.5">
          <Image src="/sub-logo.png" alt="Sub" width={24} height={24} className="rounded-md" />
          <span className="font-mono font-bold text-[15px] text-label">Sub</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-label-3 hidden sm:inline">
            DevCareer × Nomba 2026
          </span>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 bg-yellow text-black font-mono text-[11px] uppercase tracking-widest px-3.5 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Start Building <ArrowRight size={12} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen pt-14 px-6">
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "22%", left: "50%", transform: "translateX(-50%)",
            width: "800px", height: "500px",
            background: "radial-gradient(ellipse at center, rgba(232,184,0,0.065) 0%, transparent 70%)",
          }}
        />

        <div className="font-mono text-[10px] uppercase tracking-widest text-label-3 border border-stroke rounded-full px-4 py-1.5 mb-8">
          DevCareer × Nomba Hackathon 2026
        </div>

        <h1 className="font-sans font-extrabold text-[52px] sm:text-[68px] leading-[1.03] tracking-[-1.5px] max-w-4xl mb-6 text-label">
          Subscription billing<br />
          for{" "}
          <span className="text-yellow">Nigerian SaaS</span>
        </h1>

        <p className="font-sans text-[16px] sm:text-[18px] text-label-2 max-w-xl mb-10 leading-relaxed">
          Drop Sub into your stack and get recurring billing, dunning, retry logic, and Nomba-powered payments — fully automated.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-yellow text-black font-mono text-[12px] uppercase tracking-widest px-5 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Create free account <ArrowRight size={13} />
          </Link>
          <Link
            href="/overview"
            className="flex items-center gap-2 border border-stroke text-label-2 font-mono text-[12px] uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-surface transition-colors"
          >
            View dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-label-3">
          <Zap size={11} className="text-yellow" />
          Powered by Nomba Payments
        </div>
      </section>

      {/* How it works */}
      <section className="px-8 pb-28 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-mono text-[10px] uppercase tracking-widest text-yellow mb-3">How it works</p>
          <h2 className="font-sans font-bold text-[32px] text-label">From zero to billing in minutes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <div key={i} className="bg-surface border border-stroke rounded-2xl p-6">
              <div className="w-8 h-8 rounded-lg bg-yellow text-black flex items-center justify-center mb-5">
                <span className="font-mono font-bold text-[13px]">{i + 1}</span>
              </div>
              <h3 className="font-sans font-semibold text-[15px] text-label mb-2">{step.title}</h3>
              <p className="font-sans text-[13px] text-label-2 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-stroke px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-mono text-[10px] uppercase tracking-widest text-yellow mb-3">Features</p>
            <h2 className="font-sans font-bold text-[32px] text-label">Everything billing needs</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-surface-2 border border-stroke rounded-xl p-5">
                <f.icon size={18} className="text-yellow mb-3" />
                <h3 className="font-sans font-semibold text-[14px] text-label mb-1.5">{f.title}</h3>
                <p className="font-sans text-[12px] text-label-3 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API preview */}
      <section className="border-t border-stroke px-8 py-24 bg-surface">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-yellow mb-4">Developer first</p>
            <h2 className="font-sans font-bold text-[28px] text-label mb-4">
              Ship billing in an afternoon
            </h2>
            <p className="font-sans text-[14px] text-label-2 leading-relaxed mb-6">
              A clean REST API with idempotency keys, structured errors, and signed webhooks. Three endpoints and you&apos;re collecting money.
            </p>
            <div className="space-y-2.5">
              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Check size={12} className="text-yellow flex-shrink-0" />
                  <span className="font-sans text-[13px] text-label-2">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-canvas rounded-2xl border border-stroke overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-2 border-b border-stroke">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F56" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#27C93F" }} />
              <span className="ml-4 font-mono text-[10px] text-label-3">POST /api/v1/subscriptions</span>
            </div>
            <pre className="px-5 py-5 font-mono text-[12px] leading-[1.8] text-label-2 overflow-x-auto">{`{
  "customerId": "cust_abc123",
  "planId":     "plan_xyz789"
}

// Response → 201 Created
{
  "data": {
    "id":     "sub_live_...",
    "status": "TRIALING",
    "currentPeriodEnd": "2026-08-06"
  }
}`}</pre>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {METRICS.map((m, i) => (
            <div key={i}>
              <div className="font-mono font-bold text-[44px] leading-none mb-2 text-yellow">{m.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-label-3">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-stroke px-8 py-20">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-sans font-bold text-[28px] text-label mb-4">Ready to ship?</h2>
          <p className="font-sans text-[14px] text-label-2 mb-8">
            Create your free tenant and start processing subscriptions in under two minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-yellow text-black font-mono text-[12px] uppercase tracking-widest px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Create free account <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stroke px-8 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/sub-logo.png" alt="Sub" width={20} height={20} className="rounded" />
            <span className="font-mono text-[12px] text-label-3">Sub — DevCareer × Nomba 2026</span>
          </div>
          <span className="font-mono text-[11px] text-label-3">Built by Lazy-Code-X01</span>
        </div>
      </footer>
    </main>
  );
}
