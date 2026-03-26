"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ADVISORY_MODELS } from "@/data/advisory-models";
import { MODEL_CATEGORIES } from "@/data/categories";
import { AppHeader } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModelCard } from "@/components/models/model-card";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

type ModelRecommendation = {
  modelId: string;
  name: string;
  fitScore: number;
  rationale: string;
  pros: string[];
  cons: string[];
  expectedOutput: string[];
};

type ModelAdvice = {
  summary: string;
  recommendations: ModelRecommendation[];
  recommendedModelId: string;
  recommendationReason: string;
};

export default function NewAnalysisPage() {
  const params = useParams();
  const projectId = String(params.id);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [advice, setAdvice] = useState<ModelAdvice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [adviceContext, setAdviceContext] = useState("");

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

  const loadModelAdvice = useCallback(async (extraContext?: string) => {
    setAdviceLoading(true);
    setAdviceError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/model-recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraContext }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Modeladvies ophalen mislukt.");
      }
      const data = (await res.json()) as { advice: ModelAdvice };
      setAdvice(data.advice);
    } catch (err) {
      setAdviceError(err instanceof Error ? err.message : "Modeladvies ophalen mislukt.");
    } finally {
      setAdviceLoading(false);
    }
  }, [projectId]);

  function onGenerateAdviceClick() {
    void loadModelAdvice(adviceContext.trim() || undefined);
  }

  useEffect(() => {
    void loadModelAdvice();
  }, [loadModelAdvice]);

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
        <Card className="border-[var(--blue)]/25 bg-[var(--blue-light)]">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--blue)]" />
              <CardTitle className="text-[var(--navy)]">
                Slim modeladvies voor dit project
              </CardTitle>
            </div>
            <CardDescription>
              Krijg direct de meest geschikte modellen inclusief voor- en nadelen,
              verwacht outputtype en een concreet advies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--navy)]">Aanvullende context (optioneel)</p>
              <Textarea
                value={adviceContext}
                onChange={(e) => setAdviceContext(e.target.value)}
                rows={4}
                placeholder="Bijv. tijdsdruk, interne gevoeligheden, al lopende initiatieven, harde randvoorwaarden..."
                disabled={adviceLoading}
              />
              <p className="text-xs text-[var(--gray)]">
                Deze extra context wordt meegenomen om de modelaanbeveling specifieker te maken.
              </p>
            </div>
            <Button
              type="button"
              onClick={onGenerateAdviceClick}
              disabled={adviceLoading}
              className="bg-[var(--blue)] hover:bg-[var(--blue)]/90"
            >
              {adviceLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Advies genereren...
                </>
              ) : advice ? (
                "Advies vernieuwen"
              ) : (
                "Genereer modeladvies"
              )}
            </Button>

            {adviceError ? <p className="text-sm text-red-700">{adviceError}</p> : null}

            {advice ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--gray-dark)]">{advice.summary}</p>
                <p className="text-sm text-[var(--navy)]">
                  <strong>Beste keuze:</strong> {advice.recommendationReason}
                </p>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {advice.recommendations.map((rec) => {
                    const isBest = rec.modelId === advice.recommendedModelId;
                    return (
                      <Card
                        key={rec.modelId}
                        className={cn(isBest && "border-[var(--blue)] ring-1 ring-[var(--blue)]/30")}
                      >
                        <CardHeader className="space-y-2 pb-2">
                          <CardTitle className="text-base text-[var(--navy)]">
                            {rec.name}
                          </CardTitle>
                          <CardDescription>
                            Fit-score: {rec.fitScore}/10 {isBest ? "• Aanbevolen" : ""}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-[var(--gray-dark)]">
                          <p>{rec.rationale}</p>
                          <div>
                            <p className="font-medium text-[var(--navy)]">Voordelen</p>
                            <ul className="list-disc pl-5">
                              {rec.pros.map((pro, idx) => (
                                <li key={idx}>{pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--navy)]">Nadelen</p>
                            <ul className="list-disc pl-5">
                              {rec.cons.map((con, idx) => (
                                <li key={idx}>{con}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-[var(--navy)]">
                              Verwachte output uit model
                            </p>
                            <ul className="list-disc pl-5">
                              {rec.expectedOutput.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <Button
                            asChild
                            className="w-full bg-[var(--blue)] hover:bg-[var(--blue)]/90"
                          >
                            <Link href={`/projects/${projectId}/analyses/${rec.modelId}`}>
                              Gebruik dit model
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

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
