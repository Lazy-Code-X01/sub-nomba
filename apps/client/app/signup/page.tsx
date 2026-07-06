"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name,          setName]          = useState("");
  const [webhookUrl,    setWebhookUrl]    = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
      const res = await fetch(`${baseUrl}/api/v1/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          ...(webhookUrl.trim()    ? { webhookUrl:    webhookUrl.trim()    } : {}),
          ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to create account");
      const tenant = json.data ?? json;
      localStorage.setItem("sub_api_key",        tenant.apiKey);
      localStorage.setItem("sub_tenant_id",       tenant.id);
      localStorage.setItem("sub_tenant_name",     tenant.name);
      localStorage.setItem("sub_webhook_secret",  tenant.webhookSecret ?? "");
      localStorage.setItem("sub_webhook_url",     tenant.webhookUrl    ?? "");
      router.push("/overview");
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Image src="/sub-logo.png" alt="Sub" width={28} height={28} className="rounded-lg" />
        <span className="font-mono font-bold text-[16px] text-label">Sub</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="font-sans font-bold text-[24px] text-label mb-2">Create your account</h1>
          <p className="font-sans text-[13px] text-label-2">
            You&apos;ll get an API key to start billing customers instantly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">
              Business Name
            </span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-surface border border-stroke rounded-xl px-4 py-3 font-sans text-[14px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow transition-colors"
              placeholder="Acme Corp"
              required
              autoFocus
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">
              Webhook URL{" "}
              <span className="text-label-3 normal-case tracking-normal font-sans text-[11px]">— optional</span>
            </span>
            <input
              type="url"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="w-full bg-surface border border-stroke rounded-xl px-4 py-3 font-mono text-[13px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow transition-colors"
              placeholder="https://your-app.com/webhooks/sub"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-label-3 block mb-1.5">
              Webhook Secret{" "}
              <span className="text-label-3 normal-case tracking-normal font-sans text-[11px]">— auto-generated if blank</span>
            </span>
            <input
              value={webhookSecret}
              onChange={e => setWebhookSecret(e.target.value)}
              className="w-full bg-surface border border-stroke rounded-xl px-4 py-3 font-mono text-[13px] text-label placeholder:text-label-3 focus:outline-none focus:border-yellow transition-colors"
              placeholder="Leave blank to auto-generate"
            />
          </label>

          {error && (
            <p
              className="font-mono text-[11px] bg-surface border border-stroke rounded-lg px-3 py-2.5"
              style={{ color: "#F87171" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 bg-yellow font-mono text-[12px] uppercase tracking-widest py-3.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ color: "#000" }}
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Creating account…</>
            ) : (
              <>Create account <ArrowRight size={14} /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-[11px] text-label-3">
          Already have an API key?{" "}
          <Link href="/overview" className="text-yellow hover:opacity-80 transition-opacity">
            Go to dashboard →
          </Link>
        </p>
      </div>

      <div className="mt-16 flex items-center gap-2 font-mono text-[10px] text-label-3 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow inline-block" />
        Your credentials are stored only in your browser
      </div>
    </main>
  );
}
