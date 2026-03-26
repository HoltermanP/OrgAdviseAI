"use client";

import { usePathname } from "next/navigation";
import { MobileSidebar, Sidebar } from "@/components/layout/sidebar";

const publicPrefixes = ["/", "/sign-in", "/sign-up"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return publicPrefixes.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(`${p}/`)),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicPage = isPublicPath(pathname ?? "/");

  if (publicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileSidebar />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
