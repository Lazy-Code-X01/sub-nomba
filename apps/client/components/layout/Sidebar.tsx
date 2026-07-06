"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Users,
  RefreshCcw,
  FileText,
  AlertTriangle,
  Zap,
  Key,
  LogOut,
  LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";

interface NavItemConfig {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

const navSections: NavSectionConfig[] = [
  {
    title: "MAIN",
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/plans", label: "Plans", icon: Layers },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/subscriptions", label: "Subscriptions", icon: RefreshCcw },
    ],
  },
  {
    title: "BILLING",
    items: [
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/dunning", label: "Dunning", icon: AlertTriangle },
      { href: "/webhooks", label: "Webhooks", icon: Zap },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { href: "/api-keys", label: "API Keys", icon: Key },
    ],
  },
];

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  active,
}: NavItemConfig & { active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-[9px] text-[13px] font-sans font-medium transition-colors ${
        active
          ? "bg-yellow-dim text-yellow"
          : "text-label-2 hover:bg-surface-2 hover:text-label"
      }`}
    >
      <Icon size={14} className="flex-shrink-0" />
      <span className="flex-1 leading-none">{label}</span>
      {badge && (
        <span className="ml-auto font-mono text-[9px] bg-red text-white px-1.5 py-0.5 rounded-md leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [tenantName, setTenantName] = useState("My Business");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(j => { if (j.data?.tenantName) setTenantName(j.data.tenantName); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
  }

  return (
    <aside className="fixed left-0 top-0 w-[260px] h-full bg-surface border-r border-stroke flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[60px] border-b border-stroke flex-shrink-0">
        <Image src="/sub-logo.png" alt="Sub" width={32} height={32} className="rounded-lg flex-shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="font-sans font-bold text-[20px] leading-none text-label">Sub</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-label-3 leading-none">
            Powered by Nomba
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-label-3 px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Tenant card */}
      <div className="flex items-center gap-3 px-5 h-[64px] border-t border-stroke flex-shrink-0">
        <Avatar name={tenantName} size="md" />
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="font-sans font-semibold text-[12px] text-label leading-none truncate">
            {tenantName}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-yellow leading-none">
            Active
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-label-3 hover:text-label transition-colors flex-shrink-0"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
