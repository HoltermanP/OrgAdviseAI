import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
  dark?: boolean;
};

export function BrandLogo({
  compact = false,
  href,
  className,
  dark = false,
}: BrandLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="relative inline-flex h-10 w-32 shrink-0 overflow-hidden rounded-md ring-1 ring-black/5">
        <Image
          src={BRAND.logoUrl}
          alt={`${BRAND.websiteName} logo`}
          fill
          unoptimized
          sizes="128px"
          className="object-contain"
        />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span
            className={cn(
              "block text-sm font-semibold tracking-tight",
              dark ? "text-white" : "text-[var(--navy)]",
            )}
          >
            {BRAND.appName}
          </span>
          <span className={cn("block text-xs", dark ? "text-blue-200/90" : "text-[var(--gray)]")}>
            {BRAND.tagline}
          </span>
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}
