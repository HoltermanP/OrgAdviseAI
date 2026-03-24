import { cn } from "@/lib/utils";
import { getCategoryMeta, type ModelCategory } from "@/data/categories";

type CategoryBadgeProps = {
  category: ModelCategory | string;
  className?: string;
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const meta = getCategoryMeta(String(category));
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white",
        className,
      )}
      style={{ backgroundColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}
