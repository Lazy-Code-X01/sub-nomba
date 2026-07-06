"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { usePathname } from "next/navigation";

const PUBLIC_PATHS = ["/", "/signup", "/login", "/docs"];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden"
        style={{ marginLeft: "260px" }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
