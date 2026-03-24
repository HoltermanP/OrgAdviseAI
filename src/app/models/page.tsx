"use client";

import { useMemo, useState } from "react";
import { ADVISORY_MODELS } from "@/data/advisory-models";
import { MODEL_CATEGORIES } from "@/data/categories";
import { AppHeader } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { ModelCard } from "@/components/models/model-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ModelsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ADVISORY_MODELS.filter((m) => {
      if (category && m.category !== category) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Modellen" },
        ]}
      />
      <div className="flex flex-1 gap-6 p-4 sm:p-6">
        <aside className="hidden w-52 shrink-0 flex-col gap-2 lg:flex">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gray)]">
            Categorie
          </p>
          <Button
            type="button"
            size="sm"
            variant={category === null ? "default" : "ghost"}
            className={cn("justify-start", category === null && "bg-[var(--navy)]")}
            onClick={() => setCategory(null)}
          >
            Alle
          </Button>
          {MODEL_CATEGORIES.map((c) => (
            <Button
              key={c.key}
              type="button"
              size="sm"
              variant={category === c.key ? "default" : "ghost"}
              className="justify-start"
              style={
                category === c.key
                  ? { backgroundColor: c.color, color: "#fff" }
                  : undefined
              }
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </aside>
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold text-[var(--navy)]">
              Alle modellen ({ADVISORY_MODELS.length})
            </h1>
            <Input
              placeholder="Zoeken…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:hidden">
            <Button
              type="button"
              size="sm"
              variant={category === null ? "default" : "outline"}
              onClick={() => setCategory(null)}
            >
              Alle
            </Button>
            {MODEL_CATEGORIES.map((c) => (
              <Button
                key={c.key}
                type="button"
                size="sm"
                variant={category === c.key ? "default" : "outline"}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </Button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--gray)]">Geen resultaten.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => (
                <ModelCard key={m.id} model={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
