"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportViewer } from "@/components/reports/report-viewer";
import type { BrandStyle } from "@/db/schema";
import {
  pdfThemeFromBrandStyle,
  type PdfBrandTheme,
} from "@/lib/brand-theme";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type AnalysisRow = {
  id: string;
  modelName: string;
  status: string;
};

const REPORT_OPTIONS = [
  { value: "quick_scan", label: "Quick Scan" },
  { value: "deep_dive", label: "Deep Dive" },
  { value: "executive", label: "Executive Summary" },
  { value: "full", label: "Full Advisory Report" },
] as const;

export default function NewReportPage() {
  const params = useParams();
  const projectId = String(params.id);
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reportType, setReportType] =
    useState<(typeof REPORT_OPTIONS)[number]["value"]>("quick_scan");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [orgName, setOrgName] = useState("");
  const [pdfTheme, setPdfTheme] = useState<PdfBrandTheme>(() =>
    pdfThemeFromBrandStyle(null),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pa, aa] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/analyses`),
      ]);
      const pj = (await pa.json()) as {
        project?: { organizationName: string };
        brandStyle?: BrandStyle | null;
        error?: string;
      };
      const aj = (await aa.json()) as { analyses?: AnalysisRow[]; error?: string };
      if (!pa.ok) throw new Error(pj.error ?? "Project laden mislukt");
      if (!aa.ok) throw new Error(aj.error ?? "Analyses laden mislukt");
      setOrgName(pj.project?.organizationName ?? "");
      setPdfTheme(pdfThemeFromBrandStyle(pj.brandStyle ?? null));
      const completed = (aj.analyses ?? []).filter((a) => a.status === "completed");
      setAnalyses(completed);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function generate() {
    if (selected.size === 0) {
      toast.error("Selecteer minstens één analyse.");
      return;
    }
    setGenerating(true);
    setReportContent("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          reportType,
          selectedAnalysisIds: Array.from(selected),
          stream: true,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Genereren mislukt");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Geen stream");
      let buf = "";
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          try {
            const evt = JSON.parse(payload) as {
              type: string;
              text?: string;
              message?: string;
            };
            if (evt.type === "chunk" && evt.text) {
              text += evt.text;
              setReportContent(text);
            }
            if (evt.type === "error") {
              throw new Error(evt.message ?? "Fout");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
      toast.success("Rapport gegenereerd");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setGenerating(false);
    }
  }

  const typeLabel =
    REPORT_OPTIONS.find((r) => r.value === reportType)?.label ?? reportType;

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten", href: "/projects" },
          { label: "Project", href: `/projects/${projectId}` },
          { label: "Nieuw rapport" },
        ]}
      />
      <div className="flex-1 space-y-6 p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--gray)]" />
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-[var(--navy)]">Geen voltooide analyses</CardTitle>
              <CardDescription>
                Rond eerst minstens één analyse af voordat je een rapport maakt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/projects/${projectId}/analyses/new`}>Naar modellen</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-[var(--navy)]">Selectie</CardTitle>
                <CardDescription>
                  Kies analyses en het rapporttype. Genereren streamt live naar de preview.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Analyses</Label>
                  <ul className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                    {analyses.map((a) => (
                      <li key={a.id} className="flex items-center gap-2">
                        <Checkbox
                          id={a.id}
                          checked={selected.has(a.id)}
                          onCheckedChange={() => toggle(a.id)}
                        />
                        <label htmlFor={a.id} className="text-sm text-[var(--gray-dark)]">
                          {a.modelName}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label>Rapporttype</Label>
                  <Select
                    value={reportType}
                    onValueChange={(v) =>
                      setReportType(v as (typeof REPORT_OPTIONS)[number]["value"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  className="w-full bg-[var(--navy)] hover:bg-[var(--navy)]/90"
                  disabled={generating}
                  onClick={() => void generate()}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Genereren…
                    </>
                  ) : (
                    "Genereer rapport"
                  )}
                </Button>
              </CardContent>
            </Card>

            <div>
              {reportContent ? (
                <ReportViewer
                  title="Preview"
                  organizationName={orgName || "Organisatie"}
                  reportTypeLabel={typeLabel}
                  documentContent={reportContent}
                  pdfTheme={pdfTheme}
                />
              ) : (
                <Card className="h-full min-h-[320px] border-dashed">
                  <CardContent className="flex h-full items-center justify-center text-sm text-[var(--gray)]">
                    Preview verschijnt hier na het genereren.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
