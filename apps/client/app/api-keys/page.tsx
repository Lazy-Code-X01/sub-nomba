"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Copy, Check, RefreshCcw, AlertTriangle, Key, Webhook } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { apiPost } from "@/lib/api";

interface Tenant { id: string; apiKey: string; name: string; }

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
  const [apiKey,         setApiKey]         = useState<string | null>(null);
  const [tenantId,       setTenantId]       = useState<string | null>(null);
  const [webhookUrl,     setWebhookUrl]     = useState<string | null>(null);
  const [webhookSecret,  setWebhookSecret]  = useState<string | null>(null);
  const [showKey,        setShowKey]        = useState(false);
  const [showSecret,     setShowSecret]     = useState(false);
  const [rotating,       setRotating]       = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem("sub_api_key") ?? process.env.NEXT_PUBLIC_API_KEY ?? null);
    setTenantId(localStorage.getItem("sub_tenant_id"));
    setWebhookUrl(localStorage.getItem("sub_webhook_url") || null);
    setWebhookSecret(localStorage.getItem("sub_webhook_secret") || null);
  }, []);

  async function handleRotate() {
    if (!tenantId) return;
    if (!confirm("Rotate your API key? Your current key will stop working immediately.")) return;
    setRotating(true);
    try {
      const tenant = await apiPost<Tenant>(`/api/v1/tenants/${tenantId}/rotate-key`);
      localStorage.setItem("sub_api_key", tenant.apiKey);
      setApiKey(tenant.apiKey);
      setShowKey(true);
    } catch (err) {
      alert((err as Error).message ?? "Failed to rotate key");
    } finally {
      setRotating(false);
    }
  }

  const displayKey    = apiKey
    ? (showKey    ? apiKey          : maskKey(apiKey))
    : "No key found — sign in to see your key";

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
    <div className="space-y-5 max-w-3xl">

      {/* Warning */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-surface-2 border border-stroke rounded-xl">
        <AlertTriangle size={14} className="text-yellow flex-shrink-0 mt-0.5" />
        <p className="font-sans text-[12px] text-label-2 leading-relaxed">
          Your API key is stored in your browser. Never expose it in client-side code in production — use it only from your backend server.
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

          {webhookUrl ? (
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
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="font-sans text-[13px] text-label-2 mb-1">No webhook configured</p>
              <p className="font-mono text-[11px] text-label-3">
                Add a webhook URL when creating a new account, or via{" "}
                <span className="text-label-2">PATCH /api/v1/tenants/:id</span>.
              </p>
            </div>
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
