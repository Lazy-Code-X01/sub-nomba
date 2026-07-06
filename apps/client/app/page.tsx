"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, RefreshCcw, Bell, GitBranch } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "API",      href: "#api" },
];

const STEPS = [
  {
    n: "01",
    title: "Create a plan",
    desc: "Define pricing in 30 seconds: monthly, annual, or custom billing intervals with optional trial days.",
  },
  {
    n: "02",
    title: "Subscribe a customer",
    desc: "Link a customer to a plan. Sub handles the full state machine from TRIALING to ACTIVE to PAST_DUE automatically.",
  },
  {
    n: "03",
    title: "Revenue on autopilot",
    desc: "At period end, Sub charges via Nomba, retries failures, fires webhooks, and keeps your MRR dashboard current.",
  },
];

const SUB_STATES = [
  { label: "CREATED",  dot: "bg-label-3",  text: "text-label-3", desc: "Subscription initialised" },
  { label: "TRIALING", dot: "bg-amber",    text: "text-amber",   desc: "Free trial period running" },
  { label: "ACTIVE",   dot: "bg-green",    text: "text-green",   desc: "Billing live, renewals charging", highlight: true },
  { label: "PAST_DUE", dot: "bg-red",      text: "text-red",     desc: "Payment failed, dunning queued" },
];

const WEBHOOK_FEED = [
  { event: "invoice.paid",         time: "just now", live: true },
  { event: "subscription.active",  time: "just now", live: true },
  { event: "invoice.created",      time: "30s ago",  live: false },
  { event: "subscription.created", time: "1m ago",   live: false },
];

const DUNNING = [
  { n: 1, label: "Immediately",  done: true,  failed: true },
  { n: 2, label: "After 2 days", done: true,  failed: true },
  { n: 3, label: "After 4 days", done: false, failed: false },
];

const CHECKLIST = [
  "Plans, customers, subscriptions via REST",
  "Signed webhook events for every state change",
  "Nomba checkout links for manual collection",
  "Dunning queue with automatic retries",
];

const METRICS = [
  { value: "< 2min", label: "Time to first invoice" },
  { value: "6",      label: "Subscription states" },
  { value: "3×",     label: "Retry attempts" },
  { value: "100%",   label: "Nomba native" },
];

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.35, rootMargin: "-64px 0px -40% 0px" },
    );
    ["how-it-works", "features", "api"].forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-canvas font-sans antialiased">

      {/* ── Floating pill nav ──────────────────────────────────────────────── */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-4rem)] max-w-3xl">
        <div className="flex items-center justify-between bg-canvas/85 backdrop-blur-md border border-stroke rounded-full px-5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-0">
            <Image src="/sub-logo.png" alt="Sub" width={42} height={42} className="rounded-md block" />
          </div>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href }) => (
              <a key={href} href={href} className="relative font-sans text-[13px] text-label-3 hover:text-label transition-colors">
                {label}
                <span className={`absolute -bottom-0.5 left-0 h-px bg-yellow rounded-full transition-all duration-300 ${activeSection === href.slice(1) ? "w-full" : "w-0"}`} />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/docs" className="hidden sm:block font-sans text-[13px] text-label-3 hover:text-label transition-colors">
              Docs
            </Link>
            <Link
              href="/signup"
              className="bg-yellow text-black font-sans text-[13px] font-semibold px-4 py-2 rounded-full hover:opacity-90 active:scale-95 transition-all"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative flex flex-col items-center justify-center text-center min-h-screen pt-32 px-6 overflow-hidden">
        {/* Radial glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 900px 500px at 50% 42%, rgba(232,184,0,0.07) 0%, transparent 70%)" }}
        />
        {/* Dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.018]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--border2) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Headline */}
        <h1 className="fade-up-2 font-sans font-black text-[48px] sm:text-[62px] lg:text-[72px] leading-[0.93] tracking-[-2px] max-w-3xl mb-6 text-label">
          Subscription billing<br />
          for{" "}
          <em className="not-italic" style={{ color: "var(--yellow)" }}>Nigerian</em>
          {" "}SaaS
        </h1>

        {/* Subheading */}
        <p className="fade-up-3 font-sans text-[17px] sm:text-[19px] text-label-2 max-w-xl mb-10 leading-relaxed">
          Drop Sub into your stack and get recurring billing, dunning, retry logic,
          and Nomba-powered payments. Fully automated.
        </p>

        {/* CTAs */}
        <div className="fade-up-4 flex flex-wrap items-center justify-center gap-4 mb-20">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-yellow text-black font-sans text-[14px] font-semibold px-6 py-3.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
            style={{ boxShadow: "0 8px 28px rgba(232,184,0,0.28)" }}
          >
            Create free account
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 border border-stroke text-label-2 font-sans text-[14px] px-6 py-3.5 rounded-full hover:bg-surface hover:text-label transition-all"
          >
            Read the docs
          </Link>
        </div>

        {/* ── Hero card stack ──────────────────────────────────────────────── */}
        <div className="fade-up-5 relative w-full max-w-4xl h-80">
          {/* Left — customer */}
          <div className="absolute left-[2%] top-10 w-56 sm:w-64 -rotate-6 scale-90 hover:-rotate-3 hover:scale-[0.93] hover:-translate-y-2 transition-all duration-300 cursor-default">
            <div className="bg-surface border border-stroke rounded-3xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-[12px] text-label-2">DO</span>
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-[15px] font-semibold text-label leading-none mb-1">Dave Okafor</p>
                  <p className="font-mono text-[11px] text-label-3 truncate">dave@gmail.com</p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-label-3 bg-surface-2 border border-stroke px-3 py-1 rounded-full uppercase tracking-widest">
                Customer
              </span>
            </div>
          </div>

          {/* Center — subscription */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-72 sm:w-80 z-20 hover:-translate-y-3 transition-transform duration-300 cursor-default">
            <div
              className="bg-surface-2 border border-stroke rounded-3xl p-7"
              style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 80px rgba(232,184,0,0.07)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[11px] uppercase tracking-widest text-label-3">Pro Monthly</span>
                <span className="font-mono text-[10px] font-semibold text-green bg-green-dim px-2.5 py-1 rounded-full">ACTIVE</span>
              </div>
              <p className="font-sans font-black text-[40px] text-label tracking-tight leading-none mb-1">₦5,000</p>
              <p className="font-mono text-[11px] text-label-3 mb-5">per month</p>
              <div className="h-px bg-stroke mb-5" />
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-label-3">Next billing</span>
                <span className="font-mono text-[11px] text-label-2">6 Aug 2026</span>
              </div>
            </div>
          </div>

          {/* Right — invoice */}
          <div className="absolute right-[2%] top-10 w-56 sm:w-64 rotate-6 scale-90 hover:rotate-3 hover:scale-[0.93] hover:-translate-y-2 transition-all duration-300 cursor-default">
            <div className="bg-surface border border-stroke rounded-3xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[11px] uppercase tracking-widest text-label-3">Invoice</span>
                <span className="font-mono text-[10px] font-semibold text-green bg-green-dim px-2 py-1 rounded-full">PAID</span>
              </div>
              <p className="font-sans font-black text-[32px] text-label tracking-tight leading-none mb-1">₦5,000</p>
              <p className="font-mono text-[11px] text-label-3 mb-4">6 Jul 2026</p>
              <div className="flex items-center gap-2">
                <Check size={12} className="text-green flex-shrink-0" />
                <span className="font-mono text-[11px] text-label-3">Nomba verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-8 py-28 max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-sans font-black text-[34px] tracking-tight text-label">From zero to billing in minutes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <div key={i} className="bg-surface border border-stroke rounded-[1.5rem] p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-shadow duration-300">
              <div className="w-8 h-8 rounded-xl bg-yellow text-black flex items-center justify-center mb-5 font-mono font-bold text-[12px]">
                {step.n}
              </div>
              <h3 className="font-sans font-bold text-[15px] text-label mb-2">{step.title}</h3>
              <p className="font-sans text-[13px] text-label-2 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features bento ───────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-stroke px-8 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-mono text-[10px] uppercase tracking-widest text-yellow mb-3">Features</p>
            <h2 className="font-sans font-black text-[34px] tracking-tight text-label">Everything billing needs</h2>
          </div>

          <div className="grid grid-cols-6 gap-4">

            {/* Card 1 — Lifecycle (3 cols) */}
            <div className="col-span-6 md:col-span-3 bg-surface border border-stroke rounded-[1.75rem] p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-shadow duration-300">
              <GitBranch size={20} className="text-yellow mb-4" />
              <h3 className="font-sans font-bold text-[16px] text-label mb-1.5">Lifecycle management</h3>
              <p className="font-sans text-[12px] text-label-3 leading-relaxed mb-6">
                Six states, automatic transitions. Sub handles every edge case from trial to churn.
              </p>
              <div className="flex flex-col">
                {SUB_STATES.map((s, i) => (
                  <div key={i} className="flex items-stretch gap-3">
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center w-4 flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${s.dot} ${s.highlight ? "shadow-[0_0_8px_2px_rgba(34,197,94,0.4)]" : ""}`} />
                      {i < SUB_STATES.length - 1 && (
                        <div className="w-px flex-1 bg-stroke mt-1 mb-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`pb-4 ${i === SUB_STATES.length - 1 ? "pb-0" : ""}`}>
                      <span className={`font-mono text-[11px] font-semibold uppercase tracking-widest ${s.text}`}>{s.label}</span>
                      <p className="font-sans text-[12px] text-label-3 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 — Nomba STAR (3 cols) */}
            <div className="col-span-6 md:col-span-3 relative bg-canvas border border-stroke rounded-[1.75rem] p-6 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow duration-300">
              <div
                aria-hidden
                className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"
                style={{ background: "rgba(232,184,0,0.14)", filter: "blur(64px)" }}
              />
              <Image src="/nomba-logo.png" alt="Nomba" width={80} height={24} className="mb-4 relative invert opacity-90" />
              <h3 className="font-sans font-bold text-[16px] text-label mb-1.5 relative">Nomba native</h3>
              <p className="font-sans text-[12px] text-label-3 leading-relaxed mb-5 relative">
                One call, checkout link ready. Card tokenisation for renewals built in.
              </p>
              <div className="relative bg-surface-2 border border-stroke rounded-xl p-4 font-mono text-[11px] leading-[1.9]">
                <p className="text-label-3">POST /api/v1/invoices/:id/checkout</p>
                <div className="h-px bg-stroke my-2" />
                <p>
                  <span className="text-yellow">&quot;checkoutLink&quot;</span>
                  <span className="text-label-3">: </span>
                  <span className="text-green">&quot;https://checkout.nomba.com/...&quot;</span>
                </p>
                <p>
                  <span className="text-yellow">&quot;orderReference&quot;</span>
                  <span className="text-label-3">: </span>
                  <span className="text-label-2">&quot;inv_abc-178...&quot;</span>
                </p>
              </div>
            </div>

            {/* Card 3 — Webhooks (4 cols) */}
            <div className="col-span-6 md:col-span-4 bg-surface border border-stroke rounded-[1.75rem] p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-shadow duration-300">
              <Bell size={20} className="text-yellow mb-4" />
              <h3 className="font-sans font-bold text-[16px] text-label mb-1.5">Signed webhook events</h3>
              <p className="font-sans text-[12px] text-label-3 leading-relaxed mb-5">
                Every state change fires a signed webhook. HMAC-SHA256, 3× retry, full delivery log.
              </p>
              {/* Terminal feed */}
              <div className="bg-canvas border border-stroke rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-stroke bg-surface-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#FF5F56" }} />
                    <span className="w-2 h-2 rounded-full" style={{ background: "#FFBD2E" }} />
                    <span className="w-2 h-2 rounded-full" style={{ background: "#27C93F" }} />
                  </div>
                  <span className="font-mono text-[10px] text-label-3">webhook delivery log</span>
                  <span className="font-mono text-[10px] text-green">● live</span>
                </div>
                <div className="divide-y divide-stroke">
                  {WEBHOOK_FEED.map((w, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${w.live ? "bg-green animate-pulse" : "bg-label-3"}`} />
                        <code className="font-mono text-[11px] text-label-2">{w.event}</code>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] text-label-3">{w.time}</span>
                        <span className="font-mono text-[9px] text-green bg-green-dim px-1.5 py-0.5 rounded">200</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 4 — Dunning (2 cols) */}
            <div className="col-span-6 md:col-span-2 bg-surface border border-stroke rounded-[1.75rem] p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-shadow duration-300">
              <RefreshCcw size={20} className="text-yellow mb-4" />
              <h3 className="font-sans font-bold text-[16px] text-label mb-1.5">Smart dunning</h3>
              <p className="font-sans text-[12px] text-label-3 leading-relaxed mb-5">
                Failed charges retry 3× with exponential backoff. Revenue recovery on autopilot.
              </p>
              <div className="flex flex-col gap-0">
                {DUNNING.map((d, i) => (
                  <div key={i} className="flex items-stretch gap-3">
                    <div className="flex flex-col items-center w-5 flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${d.failed ? "bg-red-dim border-red/40" : "bg-surface-2 border-stroke"}`}>
                        {d.failed
                          ? <span className="font-mono text-[9px] text-red font-bold">✕</span>
                          : <span className="font-mono text-[9px] text-label-3">{d.n}</span>
                        }
                      </div>
                      {i < DUNNING.length - 1 && (
                        <div className={`w-px flex-1 my-1 ${d.failed ? "bg-red/30" : "bg-stroke"}`} />
                      )}
                    </div>
                    <div className={`pb-4 flex-1 ${i === DUNNING.length - 1 ? "pb-0" : ""}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-sans text-[13px] font-medium text-label-2">Attempt {d.n}</p>
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${d.failed ? "text-red border-red/30 bg-red-dim" : "text-label-3 border-stroke"}`}>
                          {d.failed ? "failed" : "pending"}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-label-3 mt-0.5">{d.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── API preview ──────────────────────────────────────────────────────── */}
      <section id="api" className="border-t border-stroke px-8 py-24 bg-surface">
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-yellow mb-4">Developer first</p>
            <h2 className="font-sans font-black text-[30px] tracking-tight text-label mb-4">
              Ship billing in an afternoon
            </h2>
            <p className="font-sans text-[14px] text-label-2 leading-relaxed mb-6">
              A clean REST API with idempotency keys, structured errors, and signed webhooks.
              Three endpoints and you&apos;re collecting money.
            </p>
            <div className="space-y-2.5 mb-8">
              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Check size={12} className="text-yellow flex-shrink-0" />
                  <span className="font-sans text-[13px] text-label-2">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 border border-stroke text-label-2 font-sans text-[13px] px-4 py-2.5 rounded-full hover:bg-surface-2 hover:text-label transition-all"
            >
              View full API reference <ArrowRight size={12} />
            </Link>
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

      {/* ── Metrics ──────────────────────────────────────────────────────────── */}
      <section className="px-8 py-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {METRICS.map((m, i) => (
            <div key={i}>
              <div className="font-mono font-black text-[44px] leading-none mb-2 text-yellow">{m.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-label-3">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA — MetaPulse-style rounded-top panel ───────────────────── */}
      <div className="px-5 pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-surface border border-stroke rounded-t-[2.5rem] px-8 pt-20 pb-10 overflow-hidden">
            {/* Yellow line at very top center */}
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px"
              style={{ background: "linear-gradient(90deg, transparent, var(--yellow), transparent)" }}
            />
            {/* Glow behind headline */}
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top, rgba(232,184,0,0.09) 0%, transparent 70%)" }}
            />

            <div className="relative text-center mb-16">
              <h2 className="font-sans font-black text-[48px] sm:text-[66px] leading-[0.93] tracking-tight text-label mb-5">
                Ready to ship<br />billing?
              </h2>
              <p className="font-sans text-[15px] text-label-2 max-w-sm mx-auto mb-8 leading-relaxed">
                Create your free tenant and start processing subscriptions in under two minutes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="flex items-center gap-2 bg-yellow text-black font-sans text-[14px] font-semibold px-6 py-3.5 rounded-full hover:opacity-90 active:scale-95 transition-all"
                  style={{ boxShadow: "0 8px 28px rgba(232,184,0,0.3)" }}
                >
                  Create free account
                </Link>
                <Link
                  href="/docs"
                  className="flex items-center gap-2 border border-stroke text-label-2 font-sans text-[14px] px-6 py-3.5 rounded-full hover:bg-surface-2 hover:text-label transition-all"
                >
                  API reference
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="px-5 py-8 max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Image src="/sub-logo.png" alt="Sub" width={20} height={20} className="rounded" />
          <span className="font-mono text-[12px] text-label-3">Sub · DevCareer × Nomba 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-label-3">Built by Adeyemi David</span>
          <a href="https://x.com/LazyCode3" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-mono text-[11px] text-label-3 hover:text-label transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @LazyCode3
          </a>
        </div>
      </div>

    </main>
  );
}
