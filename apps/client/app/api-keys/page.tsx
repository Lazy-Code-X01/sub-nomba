"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Check, RefreshCcw, AlertTriangle, Key, Webhook, Pencil, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "@/lib/toast";

interface Session {
  tenantId:      string;
  tenantName:    string;
  email:         string;
  apiKey:        string;
  webhookUrl:    string | null;
  webhookSecret: string | null;
}

interface Tenant {
  webhookUrl:    string | null;
  webhookSecret: string | null;
}

function maskKey(key: string): string {
  return key.slice(0, 12) + "••••••••••••••••••••••••";
}

function CopyButton({ value, size = 13 }: { value: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-surface-2 text-label-3 hover:text-label transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied ? <Check size={size} className="text-yellow" /> : <Copy size={size} />}
    </button>
  );
}

export default function ApiKeysPage() {
  const [session,        setSession]        = useState<Session | null>(null);
  const [tenant,         setTenant]         = useState<Tenant | null>(null);
  const [showKey,        setShowKey]        = useState(false);
  const [showSecret,     setShowSecret]     = useState(false);
  const [rotating,       setRotating]       = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(false);
  const [editUrl,        setEditUrl]        = useState("");
  const [editSecret,     setEditSecret]     = useState("");
  const [savingWebhook,  setSavingWebhook]  = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(j => {
        if (!j.data) return;
        setSession(j.data as Session);
        // fetch fresh tenant data so webhook fields are always up to date
        return fetch(`/api/proxy/api/v1/tenants/${j.data.tenantId}`)
          .then(r => r.json())
          .then(t => { if (t.data) setTenant(t.data as Tenant); });
      })
      .catch(() => {});
  }, []);

  function startEditWebhook() {
    setEditUrl(webhookUrl ?? "");
    setEditSecret("");
    setEditingWebhook(true);
  }

  async function saveWebhook() {
    if (!tenantId) return;
    setSavingWebhook(true);
    try {
      const res  = await fetch(`/api/proxy/api/v1/tenants/${tenantId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl:    editUrl.trim()    || null,
          ...(editSecret.trim() ? { webhookSecret: editSecret.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.message ?? "Failed to update webhook"); return; }
      setTenant(prev => ({
        ...prev,
        webhookUrl:    json.data.webhookUrl    ?? null,
        webhookSecret: json.data.webhookSecret ?? null,
      }));
      setEditingWebhook(false);
      toast.success("Webhook updated");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSavingWebhook(false);
    }
  }

  async function handleRotate() {
    if (!confirm("Rotate your API key? Your current key will stop working immediately.")) return;
    setRotating(true);
    try {
      const res  = await fetch("/api/auth/rotate-key", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to rotate key");
      setSession(prev => prev ? { ...prev, apiKey: json.data.apiKey } : prev);
      setShowKey(true);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to rotate key");
    } finally {
      setRotating(false);
    }
  }

  const apiKey        = session?.apiKey                             ?? null;
  const webhookUrl    = tenant?.webhookUrl    ?? session?.webhookUrl    ?? null;
  const webhookSecret = tenant?.webhookSecret ?? session?.webhookSecret ?? null;
  const tenantId      = session?.tenantId                           ?? null;

  const displayKey    = apiKey
    ? (showKey    ? apiKey          : maskKey(apiKey))
    : "Loading…";

  const displaySecret = webhookSecret
    ? (showSecret ? webhookSecret   : maskKey(webhookSecret))
    : null;

  const curlSnippet = `curl https://sub.symplax.app/api/v1/plans \\
  -H "x-api-key: ${apiKey ?? "YOUR_API_KEY"}"`;

  const verifySnippet = `const crypto = require('crypto');

function verifyWebhook(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your Express handler:
app.post('/webhooks/sub', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-sub-signature'];
  if (!verifyWebhook(req.body, sig, process.env.SUB_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const event = JSON.parse(req.body);
  console.log(event.eventType, event.data);
  res.sendStatus(200);
});`;

  return (
    <div className="space-y-5">

      {/* Warning */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-surface-2 border border-stroke rounded-xl">
        <AlertTriangle size={14} className="text-yellow flex-shrink-0 mt-0.5" />
        <p className="font-sans text-[12px] text-label-2 leading-relaxed">
          Never expose your API key in client-side code. Use it only from your backend server.
        </p>
      </div>

      {/* API Key card */}
      <Card title="Your API Key">
        <div className="space-y-5">

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-label-3 mb-2">Secret Key</p>
            <div className="flex items-center gap-2 p-3 bg-surface-2 border border-stroke rounded-xl">
              <Key size={13} className="text-label-3 flex-shrink-0" />
              <span className="font-mono text-[12px] text-label flex-1 truncate select-all">
                {displayKey}
              </span>
              <button
                onClick={() => setShowKey(v => !v)}
                className="p-1.5 rounded-lg hover:bg-surface-2 text-label-3 hover:text-label transition-colors flex-shrink-0"
                title={showKey ? "Hide" : "Reveal"}
              >
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              {apiKey && <CopyButton value={apiKey} />}
            </div>
          </div>

          {tenantId && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-label-3 mb-2">Tenant ID</p>
              <div className="flex items-center gap-2 p-3 bg-surface-2 border border-stroke rounded-xl">
                <span className="font-mono text-[12px] text-label-2 flex-1 truncate">
                  {tenantId}
                </span>
                <CopyButton value={tenantId} />
              </div>
            </div>
          )}

          <div className="border-t border-stroke" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-[13px] font-medium text-label">Rotate API Key</p>
              <p className="font-mono text-[11px] text-label-3 mt-0.5">
                Generates a new key. Your current key stops working immediately.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRotate} disabled={rotating || !tenantId}>
              <RefreshCcw size={12} className={rotating ? "animate-spin" : ""} />
              {rotating ? "Rotating…" : "Rotate Key"}
            </Button>
          </div>

        </div>
      </Card>

      {/* Webhook Configuration */}
      <Card title="Webhook Configuration">
        <div className="space-y-5">

          {editingWebhook ? (
            /* ---- Edit form ---- */
            <div className="space-y-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-label-3 mb-2">Endpoint URL</p>
                <input
                  type="url"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  placeholder="https://your-app.com/webhooks/sub"
                  className="w-full bg-surface-2 border border-stroke rounded-xl px-3.5 py-3 font-mono text-[12px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow/40 transition-colors"
                />
              </div>

              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-label-3 mb-2">
                  New Signing Secret <span className="text-label-3 normal-case tracking-normal font-sans">(leave blank to keep current)</span>
                </p>
                <input
                  type="text"
                  value={editSecret}
                  onChange={e => setEditSecret(e.target.value)}
                  placeholder="Enter new secret or leave blank"
                  className="w-full bg-surface-2 border border-stroke rounded-xl px-3.5 py-3 font-mono text-[12px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow/40 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={saveWebhook}
                  disabled={savingWebhook}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow text-black font-sans text-[13px] font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {savingWebhook ? <><Loader2 size={12} className="animate-spin" /> Saving</> : "Save"}
                </button>
                <button
                  onClick={() => setEditingWebhook(false)}
                  disabled={savingWebhook}
                  className="px-4 py-2.5 border border-stroke rounded-xl font-sans text-[13px] text-label-2 hover:text-label hover:border-label-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : webhookUrl ? (
            /* ---- View mode (webhook exists) ---- */
            <>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-label-3 mb-2">Endpoint URL</p>
                <div className="flex items-center gap-2 p-3 bg-surface-2 border border-stroke rounded-xl">
                  <Webhook size={13} className="text-label-3 flex-shrink-0" />
                  <span className="font-mono text-[12px] text-label-2 flex-1 truncate">{webhookUrl}</span>
                  <CopyButton value={webhookUrl} />
                </div>
              </div>

              {displaySecret && (
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-label-3 mb-2">Signing Secret</p>
                  <div className="flex items-center gap-2 p-3 bg-surface-2 border border-stroke rounded-xl">
                    <Key size={13} className="text-label-3 flex-shrink-0" />
                    <span className="font-mono text-[12px] text-label flex-1 truncate select-all">
                      {displaySecret}
                    </span>
                    <button
                      onClick={() => setShowSecret(v => !v)}
                      className="p-1.5 rounded-lg hover:bg-surface-2 text-label-3 hover:text-label transition-colors flex-shrink-0"
                      title={showSecret ? "Hide" : "Reveal"}
                    >
                      {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    {webhookSecret && <CopyButton value={webhookSecret} />}
                  </div>
                  <p className="font-mono text-[10px] text-label-3 mt-2">
                    Verify incoming requests using the{" "}
                    <span className="text-label-2">X-Sub-Signature</span> header (HMAC-SHA256).
                  </p>
                </div>
              )}

              <div className="border-t border-stroke" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-[13px] font-medium text-label">Update Webhook</p>
                  <p className="font-mono text-[11px] text-label-3 mt-0.5">Change your endpoint URL or signing secret.</p>
                </div>
                <button
                  onClick={startEditWebhook}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-stroke rounded-xl font-sans text-[13px] text-label-2 hover:bg-surface-2 hover:text-label transition-colors"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              </div>
            </>
          ) : (
            /* ---- Empty state ---- */
            <>
              <div className="py-4 text-center">
                <p className="font-sans text-[13px] text-label-2 mb-1">No webhook configured</p>
                <p className="font-mono text-[11px] text-label-3">
                  Add an endpoint URL to receive real-time subscription events.
                </p>
              </div>

              <div className="border-t border-stroke" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-[13px] font-medium text-label">Configure Webhook</p>
                  <p className="font-mono text-[11px] text-label-3 mt-0.5">Set up your endpoint URL and signing secret.</p>
                </div>
                <button
                  onClick={startEditWebhook}
                  className="flex items-center gap-1.5 px-3.5 py-2 border border-stroke rounded-xl font-sans text-[13px] text-label-2 hover:bg-surface-2 hover:text-label transition-colors"
                >
                  <Pencil size={12} />
                  Add
                </button>
              </div>
            </>
          )}

        </div>
      </Card>

      {/* Usage example */}
      <Card title="Authentication">
        <div>
          <p className="font-sans text-[13px] text-label-2 mb-4">
            Pass your API key in the <span className="font-mono text-[12px] text-label">x-api-key</span> header on every request.
          </p>
          <div className="rounded-xl bg-canvas border border-stroke overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-2 border-b border-stroke">
              <span className="w-2 h-2 rounded-full" style={{ background: "#FF5F56" }} />
              <span className="w-2 h-2 rounded-full" style={{ background: "#FFBD2E" }} />
              <span className="w-2 h-2 rounded-full" style={{ background: "#27C93F" }} />
              <span className="ml-3 font-mono text-[10px] text-label-3">curl</span>
            </div>
            <pre className="px-5 py-4 font-mono text-[12px] leading-[1.8] text-label-2 overflow-x-auto whitespace-pre">{curlSnippet}</pre>
          </div>
        </div>
      </Card>

      {/* Webhook verification snippet */}
      {webhookUrl && (
        <Card title="Webhook Verification">
          <div>
            <p className="font-sans text-[13px] text-label-2 mb-4">
              Verify the <span className="font-mono text-[12px] text-label">X-Sub-Signature</span> header on every incoming webhook to confirm it came from Sub.
            </p>
            <div className="rounded-xl bg-canvas border border-stroke overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-2 border-b border-stroke">
                <span className="w-2 h-2 rounded-full" style={{ background: "#FF5F56" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "#FFBD2E" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "#27C93F" }} />
                <span className="ml-3 font-mono text-[10px] text-label-3">Node.js / Express</span>
              </div>
              <pre className="px-5 py-4 font-mono text-[11px] leading-[1.8] text-label-2 overflow-x-auto whitespace-pre">{verifySnippet}</pre>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
