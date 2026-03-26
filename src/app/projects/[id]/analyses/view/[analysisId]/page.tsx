"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { AnalysisResult } from "@/components/analyses/analysis-result";
import { analysisOutputSchema, type AnalysisOutput } from "@/lib/analysis-output";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type AnalysisApi = {
  id: string;
  modelName: string;
  status: string;
  outputData: unknown;
};

export default function AnalysisViewPage() {
  const params = useParams();
  const projectId = String(params.id);
  const analysisId = String(params.analysisId);
  const [data, setData] = useState<AnalysisOutput | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/analyses/${analysisId}`);
        const j = (await res.json()) as { analysis?: AnalysisApi; error?: string };
        if (!res.ok) throw new Error(j.error ?? "Laden mislukt");
        const a = j.analysis;
        if (!a || cancelled) return;
        setTitle(a.modelName);
        const parsed = analysisOutputSchema.safeParse(a.outputData);
        if (parsed.success) {
          setData(parsed.data);
        } else {
          toast.error("Opgeslagen resultaat heeft een onbekend formaat.");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fout");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten", href: "/projects" },
          { label: "Project", href: `/projects/${projectId}` },
          { label: title || "Analyse" },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}`}>Terug naar project</Link>
          </Button>
        }
      />
      <div className="flex-1 p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-16 text-[var(--gray)]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : data ? (
          <AnalysisResult data={data} projectId={projectId} />
        ) : (
          <p className="text-[var(--gray)]">Geen resultaat beschikbaar.</p>
        )}
      </div>
    </>
  );
}
