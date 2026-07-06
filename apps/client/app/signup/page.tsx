"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import FormField from "@/components/auth/FormField";
import { toast } from "@/lib/toast";

type Step = "account" | "webhook";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");

  const [name,          setName]          = useState("");
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [webhookUrl,    setWebhookUrl]    = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const [loading,    setLoading]    = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  function handleStep1(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      setShakeCount(c => c + 1);
      return;
    }
    setStep("webhook");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:  name.trim(),
          email: email.trim(),
          password,
          ...(webhookUrl.trim()    ? { webhookUrl:    webhookUrl.trim()    } : {}),
          ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message ?? "Failed to create account");
        return;
      }
      router.push("/overview");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <StepBar step={step} />

      {step === "account" ? (
        <AccountStep
          name={name}         setName={setName}
          email={email}       setEmail={setEmail}
          password={password} setPassword={setPassword}
          shakeCount={shakeCount}
          onSubmit={handleStep1}
        />
      ) : (
        <WebhookStep
          webhookUrl={webhookUrl}       setWebhookUrl={setWebhookUrl}
          webhookSecret={webhookSecret} setWebhookSecret={setWebhookSecret}
          loading={loading}
          onBack={() => setStep("account")}
          onSubmit={handleSubmit}
        />
      )}

      <p className="mt-6 text-center font-sans text-[13px] text-label-3">
        Already have an account?{" "}
        <Link href="/login" className="text-yellow hover:opacity-80 transition-opacity">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

function StepBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="h-1 flex-1 rounded-full bg-yellow" />
      <div className={`h-1 flex-1 rounded-full transition-colors ${step === "webhook" ? "bg-yellow" : "bg-stroke"}`} />
    </div>
  );
}

interface AccountStepProps {
  name: string;     setName:     (v: string) => void;
  email: string;    setEmail:    (v: string) => void;
  password: string; setPassword: (v: string) => void;
  shakeCount: number;
  onSubmit: (e: FormEvent) => void;
}

function AccountStep({ name, setName, email, setEmail, password, setPassword, shakeCount, onSubmit }: AccountStepProps) {
  return (
    <>
      <div className="mb-7 text-center">
        <h1 className="font-sans font-bold text-[26px] text-label mb-2">Create your account</h1>
        <p className="font-sans text-[14px] text-label-2">Step 1 of 2, your login details</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Business Name" value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" required autoFocus />
        <FormField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
        <FormField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" shakeKey={shakeCount} required />

        <button
          type="submit"
          disabled={!name.trim() || !email.trim() || !password}
          className="w-full flex items-center justify-center gap-2 bg-yellow text-black font-sans text-[14px] font-semibold py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
          style={{ boxShadow: "0 8px 28px rgba(232,184,0,0.2)" }}
        >
          Continue
        </button>
      </form>
    </>
  );
}

interface WebhookStepProps {
  webhookUrl: string;    setWebhookUrl:    (v: string) => void;
  webhookSecret: string; setWebhookSecret: (v: string) => void;
  loading: boolean;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
}

function WebhookStep({ webhookUrl, setWebhookUrl, webhookSecret, setWebhookSecret, loading, onBack, onSubmit }: WebhookStepProps) {
  return (
    <>
      <div className="mb-7 text-center">
        <h1 className="font-sans font-bold text-[26px] text-label mb-2">Webhook config</h1>
        <p className="font-sans text-[14px] text-label-2">Step 2 of 2, configure later if needed</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Webhook URL" hint="optional" mono type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-app.com/webhooks/sub" autoFocus />
        <FormField label="Webhook Secret" hint="auto-generated if blank" mono value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} placeholder="Leave blank to auto-generate" />

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-none px-5 py-3.5 border border-stroke rounded-full font-sans text-[14px] text-label-2 hover:text-label hover:border-label-2 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow text-black font-sans text-[14px] font-semibold py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ boxShadow: "0 8px 28px rgba(232,184,0,0.2)" }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Creating account</> : "Create account"}
          </button>
        </div>
      </form>
    </>
  );
}
