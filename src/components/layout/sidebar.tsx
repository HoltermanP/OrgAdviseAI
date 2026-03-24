"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Boxes, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projecten", icon: Boxes },
  { href: "/models", label: "Modellen", icon: Sparkles },
  { href: "/settings", label: "Instellingen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-[var(--gray-light)] bg-[var(--navy)] text-white">
      <div className="border-b border-white/10 px-4 py-5">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          OrgAdvisor AI
        </Link>
        <p className="mt-1 text-xs text-blue-200">AI-Group</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--blue)] text-white"
                  : "text-blue-100 hover:bg-white/10",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-blue-200">Account</span>
          <UserButton />
        </div>
      </div>
    </aside>
  );
}
