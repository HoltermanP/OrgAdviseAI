"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Boxes,
  Building2,
  LayoutDashboard,
  Menu,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizations", label: "Organisaties", icon: Building2 },
  { href: "/projects", label: "Projecten", icon: Boxes },
  { href: "/models", label: "Modellen", icon: Sparkles },
  { href: "/settings", label: "Instellingen", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-[var(--navy)] via-[#05113a] to-[#020a26] text-white shadow-2xl md:sticky md:top-0 md:flex">
      <div className="border-b border-white/10 px-4 py-5">
        <BrandLogo
          href="/dashboard"
          compact
          dark
          className="[&>span:first-child]:h-16 [&>span:first-child]:w-52"
        />
      </div>
      <nav className="flex flex-1 flex-col gap-2 p-3">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200/75">
          Navigatie
        </p>
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg shadow-blue-900/40 ring-1 ring-blue-200/35"
                  : "text-blue-100/90 hover:bg-white/12 hover:text-white",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform transition-colors",
                  !active && "group-hover:scale-110",
                )}
              />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/8 p-3 ring-1 ring-white/15 backdrop-blur-sm">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200/70">
            Account
          </p>
          <UserButton />
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon-sm" aria-label="Open navigatie" />
            }
          >
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[88%] max-w-xs bg-[var(--navy)] p-0 text-white">
            <SheetHeader className="border-b border-white/10 px-4 py-5 text-left">
              <SheetTitle className="text-white">
                <BrandLogo href="/dashboard" dark />
              </SheetTitle>
              <SheetDescription className="text-blue-200">Adviesplatform</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-2 p-3">
              {links.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-gradient-to-r from-blue-500 to-blue-400 text-white"
                        : "text-blue-100 hover:bg-white/10",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <Link
          href="/dashboard"
          className="truncate text-sm font-semibold tracking-tight text-[var(--navy)]"
        >
          AI-Group.nl
        </Link>
        <UserButton />
      </div>
    </div>
  );
}
