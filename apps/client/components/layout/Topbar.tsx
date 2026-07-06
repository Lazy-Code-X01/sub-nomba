"use client";

import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";

const pageMeta: Record<string, { title: string }> = {
  "/overview": { title: "Overview" },
  "/plans": { title: "Plans" },
  "/customers": { title: "Customers" },
  "/subscriptions": { title: "Subscriptions" },
  "/invoices": { title: "Invoices" },
  "/dunning": { title: "Dunning" },
  "/webhooks": { title: "Webhooks" },
  "/api-keys": { title: "API Keys" },
};

export default function Topbar() {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? { title: "Dashboard" };

  return (
    <header className="flex items-center justify-between px-8 h-[60px] bg-surface border-b border-stroke flex-shrink-0 sticky top-0 z-10">
      <h1 className="font-sans font-bold text-[18px] text-label leading-none">
        {meta.title}
      </h1>

      <div className="flex items-center gap-1">
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-label-2 hover:bg-surface-2 hover:text-label transition-colors">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-label-2 hover:bg-surface-2 hover:text-label transition-colors">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
