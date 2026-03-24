import Link from "next/link";
import type { AdvisoryModel } from "@/data/advisory-models";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ModelCardProps = {
  model: AdvisoryModel;
  href?: string;
  projectId?: string;
};

function excerpt(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function ModelCard({ model, href, projectId }: ModelCardProps) {
  const runHref =
    href ??
    (projectId
      ? `/projects/${projectId}/analyses/${model.id}`
      : `/projects`);

  return (
    <Card className="flex h-full flex-col border-[var(--gray-light)] shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <CategoryBadge category={model.category} />
        <CardTitle className="text-lg text-[var(--navy)]">{model.name}</CardTitle>
        <CardDescription>{excerpt(model.description)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 text-sm text-[var(--gray)]">
        <p className="line-clamp-3">{model.whenToUse}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-[var(--blue)] hover:bg-[var(--blue)]/90">
          <Link href={runHref}>
            {projectId || href ? "Analyse uitvoeren" : "Kies eerst een project"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
