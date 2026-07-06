"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const PUBLIC_PATHS = ["/", "/signup"];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isPublic) return;
    const lsKey = localStorage.getItem("sub_api_key");
    const envKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!lsKey && !envKey) {
      router.replace("/signup");
    }
  }, [isPublic, router]);

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
