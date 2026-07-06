import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const BASE = "https://sub.symplax.app";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

interface Endpoint {
  method: Method;
  path: string;
  desc: string;
  note?: string;
  query?: string;
  body?: string;
}

const METHOD_STYLE: Record<Method, string> = {
  GET:    "text-blue bg-blue-dim",
  POST:   "text-green bg-green-dim",
  PATCH:  "text-amber bg-amber-dim",
  DELETE: "text-red bg-red-dim",
};

function MethodBadge({ method }: { method: Method }) {
  return (
    <span className={`inline-flex items-center font-mono text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md ${METHOD_STYLE[method]}`}>
      {method}
    </span>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 bg-canvas border border-stroke rounded-lg px-4 py-3.5 font-mono text-[11px] leading-[1.8] text-label-2 overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Mono({ children }: { children: string }) {
  return (
    <code className="font-mono text-[12px] text-label bg-surface-2 border border-stroke px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  return (
    <div className="bg-surface border border-stroke rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-surface-2 border-b border-stroke">
        <MethodBadge method={ep.method} />
        <code className="font-mono text-[12px] text-label">{ep.path}</code>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="font-sans text-[13px] text-label-2 leading-relaxed">{ep.desc}</p>
        {ep.note && (
          <p className="font-sans text-[12px] text-yellow leading-relaxed">↳ {ep.note}</p>
        )}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-label-3">Required header</span>
          <CodeBlock>{`x-api-key: sub_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</CodeBlock>
        </div>
        {ep.query && (
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-label-3">Query params</span>
            <CodeBlock>{ep.query}</CodeBlock>
          </div>
        )}
        {ep.body && (
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-label-3">Request body</span>
            <CodeBlock>{ep.body}</CodeBlock>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ n, tag, title }: { n: string; tag: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="font-mono text-[10px] uppercase tracking-widest text-yellow mb-2">{n} — {tag}</p>
      <h2 className="font-sans font-bold text-[24px] text-label">{title}</h2>
    </div>
  );
}

function ResourceGroup({ id, title, endpoints }: { id: string; title: string; endpoints: Endpoint[] }) {
  return (
    <div id={id} className="mb-10 scroll-mt-20">
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-label-3 mb-4 pb-2 border-b border-stroke">
        {title}
      </h3>
      <div className="space-y-3">
        {endpoints.map((ep, i) => <EndpointCard key={i} ep={ep} />)}
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/plans",
    desc: "List all plans for your tenant.",
  },
  {
    method: "POST",
    path: "/api/v1/plans",
    desc: "Create a new billing plan.",
    body: `{
  "name":          "Pro Monthly",  // required
  "amount":        5000,           // required  — smallest unit (kobo for NGN)
  "currency":      "NGN",         // optional  — default "NGN"
  "interval":      "MONTHLY",     // required  — MONTHLY | ANNUAL | DAILY
  "intervalCount": 1,             // optional  — default 1
  "trialDays":     7              // optional  — default 0 (no free trial)
}`,
  },
  {
    method: "PATCH",
    path: "/api/v1/plans/:id",
    desc: "Update a plan. All fields are optional.",
    body: `{
  "name":     "Pro Monthly v2",  // optional
  "amount":   6000,              // optional
  "isActive": false              // optional — soft-deactivate
}`,
  },
  {
    method: "DELETE",
    path: "/api/v1/plans/:id",
    desc: "Soft-deactivate a plan. Existing subscriptions are not affected.",
  },
];

const CUSTOMERS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/customers",
    desc: "List all customers for your tenant.",
  },
  {
    method: "POST",
    path: "/api/v1/customers",
    desc: "Create a new customer.",
    body: `{
  "name":  "Adebayo Okafor",       // required
  "email": "adebayo@example.com"   // required
}`,
  },
];

const SUBSCRIPTIONS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/subscriptions",
    desc: "List subscriptions for your tenant. Filter by lifecycle status.",
    query: `?status=ACTIVE
// Accepted values:
// CREATED | TRIALING | ACTIVE | PAST_DUE | PAUSED | CANCELLED`,
  },
  {
    method: "POST",
    path: "/api/v1/subscriptions",
    desc: "Create a subscription linking a customer to a plan. Status starts as TRIALING if the plan has trialDays > 0, otherwise CREATED. Call /bill-now after creation to generate the first invoice.",
    body: `{
  "customerId": "3e91506d-abc7-41a2-ac33-acfe74534820",  // required — UUID
  "planId":     "a4d64215-73e0-462f-b640-48f4e9f1c4b0",  // required — UUID
  "startDate":  "2026-08-01T00:00:00Z"                   // optional — defaults to now
}`,
  },
  {
    method: "POST",
    path: "/api/v1/subscriptions/:id/bill-now",
    desc: "Generate a PENDING invoice for this subscription on demand. Pass the invoice id to POST /invoices/:id/checkout to get a Nomba payment link. Once paid, Sub automatically activates the subscription.",
    note: "Required to activate a CREATED subscription. Plans with trialDays: 0 start as CREATED and need a successful payment to reach ACTIVE.",
  },
  {
    method: "POST",
    path: "/api/v1/subscriptions/:id/pause",
    desc: "Pause an ACTIVE subscription. Billing stops until the subscription is resumed.",
  },
  {
    method: "POST",
    path: "/api/v1/subscriptions/:id/resume",
    desc: "Resume a PAUSED subscription. Reactivates billing from the next period.",
  },
  {
    method: "POST",
    path: "/api/v1/subscriptions/:id/cancel",
    desc: "Cancel a subscription. This is irreversible — use pause if you may need to resume.",
  },
  {
    method: "POST",
    path: "/api/v1/subscriptions/:id/change-plan",
    desc: "Upgrade or downgrade to a different plan on an ACTIVE subscription. Proration is calculated automatically.",
    body: `{
  "newPlanId": "b8f72c1d-9e4a-4b3f-a1d2-0c5e8f9a3b7c"  // required — UUID
}`,
  },
];

const INVOICES: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/invoices",
    desc: "List all invoices for your tenant. Optionally scope to a single subscription.",
    query: `?subscriptionId=3e91506d-abc7-41a2-ac33-acfe74534820`,
  },
  {
    method: "POST",
    path: "/api/v1/invoices/:id/checkout",
    desc: "Generate a Nomba checkout link for a PENDING invoice. Returns checkoutLink, orderReference, and invoiceId. Redirect your user to checkoutLink — Sub handles the rest automatically.",
  },
  {
    method: "POST",
    path: "/api/v1/invoices/:id/void",
    desc: "Void a PENDING invoice. Cannot be called on a PAID invoice.",
  },
];

const WEBHOOK_EVENTS_ENDPOINT: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/webhook-events",
    desc: "List all outbound webhook delivery attempts — event type, status (PENDING | DELIVERED | FAILED), attempt count, and full payload.",
  },
];

const EVENTS = [
  { event: "subscription.created",   when: "A new subscription is created.",                                   trigger: "POST /subscriptions" },
  { event: "subscription.active",    when: "Subscription transitions to ACTIVE after a successful payment.",    trigger: "Nomba payment_success" },
  { event: "subscription.cancelled", when: "Subscription is cancelled.",                                        trigger: "POST /cancel" },
  { event: "subscription.past_due",  when: "A renewal charge failed — subscription moved to PAST_DUE.",         trigger: "Nomba payment_failed" },
  { event: "invoice.created",        when: "A new invoice is generated.",                                       trigger: "POST /bill-now" },
  { event: "invoice.paid",           when: "Invoice marked PAID after a successful Nomba payment.",             trigger: "Nomba payment_success" },
  { event: "invoice.failed",         when: "Invoice marked FAILED after a Nomba payment failure.",              trigger: "Nomba payment_failed" },
];

const QUICKSTART = `# 1. Create a plan
curl -X POST ${BASE}/api/v1/plans \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Pro Monthly","amount":5000,"currency":"NGN","interval":"MONTHLY"}'

# 2. Create a customer
curl -X POST ${BASE}/api/v1/customers \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","email":"john@example.com"}'

# 3. Create a subscription
curl -X POST ${BASE}/api/v1/subscriptions \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"customerId":"<customer-id>","planId":"<plan-id>"}'

# 4. Generate invoice (required for plans with no trial)
curl -X POST ${BASE}/api/v1/subscriptions/<sub-id>/bill-now \\
  -H "x-api-key: YOUR_KEY"

# 5. Get Nomba checkout link — redirect your user here
curl -X POST ${BASE}/api/v1/invoices/<invoice-id>/checkout \\
  -H "x-api-key: YOUR_KEY"
# → { "data": { "checkoutLink": "https://checkout.nomba.com/..." } }`;

const VERIFY_SNIPPET = `import { createHmac, timingSafeEqual } from 'crypto';

function verifySubWebhook(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  try {
    return timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

// Express — register BEFORE express.json()
app.post('/webhooks/sub', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-sub-signature'] as string ?? '';

  if (!verifySubWebhook(req.body.toString(), sig, process.env.SUB_WEBHOOK_SECRET!)) {
    return res.sendStatus(401);
  }

  const { eventType, data } = JSON.parse(req.body.toString());

  switch (eventType) {
    case 'invoice.paid':
      // Grant feature access, send receipt email, etc.
      break;
    case 'subscription.cancelled':
      // Revoke access, notify the user, etc.
      break;
    case 'subscription.past_due':
      // Show a warning banner, pause non-critical features, etc.
      break;
  }

  res.sendStatus(200); // always 200 — Sub retries on non-2xx
});`;

// ─── Sidebar nav data ──────────────────────────────────────────────────────────

const NAV = [
  { label: "Quick Start",     href: "#quick-start" },
  { label: "Authentication",  href: "#auth" },
  {
    label: "Endpoints", href: "#endpoints",
    children: [
      { label: "Plans",           href: "#ep-plans" },
      { label: "Customers",       href: "#ep-customers" },
      { label: "Subscriptions",   href: "#ep-subscriptions" },
      { label: "Invoices",        href: "#ep-invoices" },
      { label: "Webhook Events",  href: "#ep-webhook-events" },
    ],
  },
  { label: "Events",          href: "#events" },
  { label: "Verification",    href: "#verification" },
  { label: "Responses",       href: "#responses" },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-canvas font-sans antialiased">

      {/* Nav */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-4rem)] max-w-3xl">
        <div className="flex items-center justify-between bg-canvas/85 backdrop-blur-md border border-stroke rounded-full px-5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-0">
            <Image src="/sub-logo.png" alt="Sub" width={42} height={42} className="rounded-md block" />
            <span className="font-sans text-[13px] text-label-3 ml-2 hidden sm:inline">/ API Reference</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="font-sans text-[13px] text-label-3 hover:text-label transition-colors">
              Home
            </Link>
            <Link
              href="/signup"
              className="bg-yellow text-black font-sans text-[13px] font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Start Building
            </Link>
          </div>
        </div>
      </nav>

      {/* Body — sidebar + content */}
      <div className="max-w-6xl mx-auto px-6 pt-28 flex gap-0">

        {/* Sticky sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-28 pt-4 pb-10 pr-6 h-[calc(100vh-7rem)] overflow-y-auto">
            <p className="font-mono text-[9px] uppercase tracking-widest text-label-3 mb-4 px-2">
              On this page
            </p>
            <nav className="space-y-0.5">
              {NAV.map((item) => (
                <div key={item.href}>
                  <a
                    href={item.href}
                    className="flex items-center px-2 py-1.5 rounded-lg font-mono text-[12px] text-label-2 hover:text-label hover:bg-surface-2 transition-colors"
                  >
                    {item.label}
                  </a>
                  {"children" in item && item.children && (
                    <div className="ml-3 mt-0.5 mb-1 space-y-0.5 border-l border-stroke pl-3">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="flex items-center py-1 font-mono text-[11px] text-label-3 hover:text-label-2 transition-colors"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-stroke">
              <p className="font-mono text-[9px] uppercase tracking-widest text-label-3 mb-3 px-2">Base URL</p>
              <code className="block font-mono text-[10px] text-label-3 bg-surface-2 border border-stroke px-2.5 py-2 rounded-lg break-all">
                {BASE}
              </code>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 py-10 lg:pl-8 lg:border-l lg:border-stroke">

          {/* Hero */}
          <div className="mb-14">
            <h1 className="font-sans font-extrabold text-[40px] sm:text-[48px] leading-[1.08] tracking-[-1px] text-label mb-4">
              Build billing<br />in an afternoon
            </h1>
            <p className="font-sans text-[14px] text-label-2 leading-relaxed max-w-xl">
              Every endpoint requires your API key in the{" "}
              <Mono>x-api-key</Mono> header. Get your key from the{" "}
              <Link href="/signup" className="text-yellow hover:underline">dashboard</Link>{" "}
              after creating a tenant.
            </p>
          </div>

          {/* 01 Quick Start */}
          <section id="quick-start" className="mb-14 scroll-mt-20">
            <SectionLabel n="01" tag="Quick Start" title="Full integration flow" />
            <p className="font-sans text-[13px] text-label-2 mb-5">
              Five calls to go from zero to a processed payment:
            </p>
            <pre className="bg-surface border border-stroke rounded-xl px-5 py-5 font-mono text-[11px] leading-[1.8] text-label-2 overflow-x-auto whitespace-pre">
              {QUICKSTART}
            </pre>
          </section>

          {/* 02 Auth */}
          <section id="auth" className="mb-14 scroll-mt-20">
            <SectionLabel n="02" tag="Authentication" title="API key" />
            <p className="font-sans text-[13px] text-label-2 mb-5 leading-relaxed">
              Pass your tenant API key in the <Mono>x-api-key</Mono> header on every request.
              Keys are scoped per tenant — data is fully isolated. Find yours in{" "}
              <Link href="/api-keys" className="text-yellow hover:underline">API Keys</Link>.
            </p>
            <pre className="bg-surface border border-stroke rounded-xl px-5 py-4 font-mono text-[11px] leading-[1.8] text-label-2 overflow-x-auto whitespace-pre">
              {`curl -X GET ${BASE}/api/v1/plans \\
  -H "x-api-key: sub_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`}
            </pre>
          </section>

          {/* 03 Endpoints */}
          <section id="endpoints" className="mb-14 scroll-mt-20">
            <SectionLabel n="03" tag="Endpoints" title="REST API" />
            <ResourceGroup id="ep-plans"          title="Plans"           endpoints={PLANS} />
            <ResourceGroup id="ep-customers"      title="Customers"       endpoints={CUSTOMERS} />
            <ResourceGroup id="ep-subscriptions"  title="Subscriptions"   endpoints={SUBSCRIPTIONS} />
            <ResourceGroup id="ep-invoices"       title="Invoices"        endpoints={INVOICES} />
            <ResourceGroup id="ep-webhook-events" title="Webhook Events"  endpoints={WEBHOOK_EVENTS_ENDPOINT} />
          </section>

          {/* 04 Events table */}
          <section id="events" className="mb-14 scroll-mt-20">
            <SectionLabel n="04" tag="Events" title="Webhook events" />
            <p className="font-sans text-[13px] text-label-2 mb-6 leading-relaxed">
              Sub sends a signed <Mono>POST</Mono> to your webhook URL for each event below.
              Every delivery includes an <Mono>X-Sub-Signature</Mono> and <Mono>X-Sub-Timestamp</Mono> header.
              Configure your endpoint in the{" "}
              <Link href="/webhooks" className="text-yellow hover:underline">Webhooks</Link> page.
            </p>
            <div className="bg-surface border border-stroke rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1.5fr_2.2fr_1.3fr] gap-4 px-5 py-3 bg-surface-2 border-b border-stroke">
                {["Event", "When it fires", "Trigger"].map(h => (
                  <span key={h} className="font-mono text-[10px] uppercase tracking-widest text-label-3">{h}</span>
                ))}
              </div>
              {EVENTS.map((e, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[1.5fr_2.2fr_1.3fr] gap-4 px-5 py-3.5 items-start ${i < EVENTS.length - 1 ? "border-b border-stroke" : ""}`}
                >
                  <code className="font-mono text-[11px] text-yellow">{e.event}</code>
                  <span className="font-sans text-[12px] text-label-2 leading-relaxed">{e.when}</span>
                  <code className="font-mono text-[10px] text-label-3">{e.trigger}</code>
                </div>
              ))}
            </div>
          </section>

          {/* 05 Verification */}
          <section id="verification" className="mb-14 scroll-mt-20">
            <SectionLabel n="05" tag="Security" title="Webhook verification" />
            <p className="font-sans text-[13px] text-label-2 mb-2 leading-relaxed">
              Each outbound webhook is signed with{" "}
              <strong className="text-label font-semibold">HMAC-SHA256</strong> over the raw JSON body
              using your tenant webhook secret. The hex-encoded signature is in <Mono>X-Sub-Signature</Mono>.
            </p>
            <p className="font-sans text-[13px] text-label-2 mb-5 leading-relaxed">
              Always use the <strong className="text-label font-semibold">raw body</strong> — not the parsed JSON object — when verifying.
            </p>
            <pre className="bg-surface border border-stroke rounded-xl px-5 py-5 font-mono text-[11px] leading-[1.8] text-label-2 overflow-x-auto whitespace-pre">
              {VERIFY_SNIPPET}
            </pre>
          </section>

          {/* 06 Responses */}
          <section id="responses" className="mb-14 scroll-mt-20">
            <SectionLabel n="06" tag="Responses" title="Response format" />
            <p className="font-sans text-[13px] text-label-2 mb-5">
              All endpoints return the same JSON envelope — check <Mono>success</Mono> first, then read <Mono>data</Mono>.
            </p>
            <pre className="bg-surface border border-stroke rounded-xl px-5 py-5 font-mono text-[11px] leading-[1.8] text-label-2 overflow-x-auto whitespace-pre">{`// 2xx — success
{
  "success": true,
  "message": "Plan created",
  "data":    { ... }
}

// 4xx / 5xx — error
{
  "success": false,
  "message": "Plan not found",
  "data":    null
}

// 400 — validation failure
{
  "success": false,
  "message": "Validation error",
  "errors":  [{ "field": "interval", "message": "Invalid enum value" }]
}`}
            </pre>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stroke px-8 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/sub-logo.png" alt="Sub" width={20} height={20} className="rounded" />
            <span className="font-mono text-[12px] text-label-3">Sub — DevCareer × Nomba 2026</span>
          </div>
          <Link href="/" className="font-mono text-[11px] text-label-3 hover:text-label transition-colors flex items-center gap-1.5">
            Back to home <ArrowUpRight size={11} />
          </Link>
        </div>
      </footer>

    </main>
  );
}
