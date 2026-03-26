import Link from "next/link";
import { Fragment } from "react";
import { Caveat } from "next/font/google";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export type BreadcrumbEntry = {
  label: string;
  href?: string;
};

type AppHeaderProps = {
  items: BreadcrumbEntry[];
  actions?: React.ReactNode;
};

const linkClass =
  "transition-colors hover:text-foreground text-muted-foreground";

const brandHandwritten = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export function AppHeader({ items, actions }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur sm:gap-4 sm:px-6 sm:py-4">
      <div className="min-w-0 flex-1">
        <Breadcrumb className="min-w-0 max-w-full overflow-x-auto">
          <BreadcrumbList>
            {items.map((item, i) => (
              <Fragment key={i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.href ? (
                    <Link href={item.href} className={cn(linkClass, "text-sm")}>
                      {item.label}
                    </Link>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="ml-auto flex w-full items-center justify-end gap-3 sm:w-auto">
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        <h1
          className={cn(
            brandHandwritten.className,
            "shrink-0 text-3xl font-bold leading-none tracking-tight text-slate-800 sm:text-4xl",
          )}
        >
          {BRAND.appName}
        </h1>
      </div>
    </header>
  );
}
