"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import FormField from "@/components/auth/FormField";
import { toast } from "@/lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message ?? "Invalid email or password");
        setShakeCount(c => c + 1);
        return;
      }
      router.push("/overview");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setShakeCount(c => c + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8 text-center">
        <h1 className="font-sans font-bold text-[26px] text-label mb-2">Welcome back</h1>
        <p className="font-sans text-[14px] text-label-2">Sign in to your Sub account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          autoFocus
        />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Your password"
          shakeKey={shakeCount}
          required
        />

        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full flex items-center justify-center gap-2 bg-yellow text-black font-sans text-[14px] font-semibold py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
          style={{ boxShadow: "0 8px 28px rgba(232,184,0,0.2)" }}
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in</> : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center font-sans text-[13px] text-label-3">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-yellow hover:opacity-80 transition-opacity">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
