import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

export function AppHeader({ items, actions }: AppHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--gray-light)] bg-white px-6 py-4">
      <Breadcrumb>
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
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
