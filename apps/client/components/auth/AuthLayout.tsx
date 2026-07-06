import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center px-6">
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 600px 400px at 50% 40%, rgba(232,184,0,0.05) 0%, transparent 70%)",
        }}
      />

      <Link href="/" className="flex items-center mb-10">
        <Image
          src="/sub-logo.png"
          alt="Sub"
          width={42}
          height={42}
          className="rounded-md block"
        />
      </Link>

      <div className="relative w-full max-w-sm bg-surface border border-stroke rounded-2xl px-8 pt-8 pb-7 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
        {children}
      </div>
    </main>
  );
}
