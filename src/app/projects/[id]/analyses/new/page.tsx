"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ADVISORY_MODELS } from "@/data/advisory-models";
import { MODEL_CATEGORIES } from "@/data/categories";
import { AppHeader } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModelCard } from "@/components/models/model-card";
import { cn } from "@/lib/utils";

export default function NewAnalysisPage() {
  const params = useParams();
  const projectId = String(params.id);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ADVISORY_MODELS.filter((m) => {
      const catOk = tab === "all" || m.category === tab;
      if (!catOk) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    });
  }, [search, tab]);

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten", href: "/projects" },
          { label: "Project", href: `/projects/${projectId}` },
          { label: "Nieuwe analyse" },
        ]}
      />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl font-semibold text-[var(--navy)]">Kies een model</h1>
          <Input
            placeholder="Zoek op naam of beschrijving…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={tab === "all" ? "default" : "outline"}
            className={cn(tab === "all" && "bg-[var(--navy)]")}
            onClick={() => setTab("all")}
          >
            Alle
          </Button>
          {MODEL_CATEGORIES.map((c) => (
            <Button
              key={c.key}
              type="button"
              size="sm"
              variant={tab === c.key ? "default" : "outline"}
              style={
                tab === c.key
                  ? { backgroundColor: c.color, color: "#fff" }
                  : undefined
              }
              onClick={() => setTab(c.key)}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--gray)]">
            Geen modellen gevonden. Pas je zoekopdracht aan.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m) => (
              <ModelCard key={m.id} model={m} projectId={projectId} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
