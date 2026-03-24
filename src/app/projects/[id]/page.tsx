"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatInterface } from "@/components/chat/chat-interface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, FileText } from "lucide-react";
import { toast } from "sonner";

type Project = {
  id: string;
  name: string;
  organizationName: string;
  sector: string;
  size: string;
  description: string;
  status: string;
  brandStyleId: string | null;
};

type BrandStyleRow = {
  id: string;
  name: string;
};

type AnalysisRow = {
  id: string;
  modelName: string;
  status: string;
  createdAt: string;
};

type ReportRow = {
  id: string;
  reportType: string;
  title: string | null;
  createdAt: string;
};

const REPORT_LABELS: Record<string, string> = {
  quick_scan: "Quick Scan",
  deep_dive: "Deep Dive",
  executive: "Executive Summary",
  full: "Full Advisory Report",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [analysesCount, setAnalysesCount] = useState(0);
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [brandStyles, setBrandStyles] = useState<BrandStyleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, ar, rr, br] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/analyses`),
        fetch(`/api/projects/${id}/reports`),
        fetch("/api/brand-styles"),
      ]);
      const pj = (await pr.json()) as {
        project?: Project;
        analysesCount?: number;
        error?: string;
      };
      const aj = (await ar.json()) as { analyses?: AnalysisRow[]; error?: string };
      const rj = (await rr.json()) as { reports?: ReportRow[]; error?: string };
      const bj = (await br.json()) as {
        brandStyles?: BrandStyleRow[];
        error?: string;
      };
      if (!pr.ok) throw new Error(pj.error ?? "Project laden mislukt");
      if (!ar.ok) throw new Error(aj.error ?? "Analyses laden mislukt");
      if (!rr.ok) throw new Error(rj.error ?? "Rapporten laden mislukt");
      if (!br.ok) throw new Error(bj.error ?? "Huisstijlen laden mislukt");
      setProject(pj.project ?? null);
      setAnalysesCount(pj.analysesCount ?? 0);
      setAnalyses(aj.analyses ?? []);
      setReports(rj.reports ?? []);
      setBrandStyles(bj.brandStyles ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setLoading(false);
    }
  }, [id]);

  async function updateBrandStyle(brandStyleId: string | null) {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandStyleId }),
      });
      const j = (await res.json()) as { project?: Project; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Bijwerken mislukt");
      if (j.project) setProject(j.project);
      toast.success("Huisstijl bijgewerkt");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !project) {
    return (
      <>
        <AppHeader
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Projecten", href: "/projects" },
            { label: "…" },
          ]}
        />
        <div className="flex flex-1 items-center justify-center p-12 text-[var(--gray)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten", href: "/projects" },
          { label: project.name },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/projects/${id}/analyses/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe analyse
              </Link>
            </Button>
            <Button asChild className="bg-[var(--blue)] hover:bg-[var(--blue)]/90">
              <Link href={`/projects/${id}/reports/new`}>
                <FileText className="mr-2 h-4 w-4" />
                Rapport
              </Link>
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="overview">Overzicht</TabsTrigger>
            <TabsTrigger value="analyses">Analyses</TabsTrigger>
            <TabsTrigger value="reports">Rapporten</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-[var(--navy)]">Huisstijl voor PDF</CardTitle>
                  <CardDescription>
                    Gekoppelde huisstijl geldt voor PDF-downloads van rapporten uit dit project.
                    Stel huisstijlen in onder Instellingen. Zonder keuze wordt een nette
                    standaardopmaak gebruikt.
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-w-md space-y-2">
                  <Label>Huisstijl</Label>
                  <Select
                    value={project.brandStyleId ?? "__none__"}
                    onValueChange={(v) =>
                      void updateBrandStyle(v === "__none__" ? null : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kies…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Standaard (OrgAdvisor)</SelectItem>
                      {brandStyles.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-[var(--navy)]">Projectinfo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-[var(--gray)]">Organisatie: </span>
                    {project.organizationName}
                  </p>
                  <p>
                    <span className="text-[var(--gray)]">Sector: </span>
                    {project.sector}
                  </p>
                  <p>
                    <span className="text-[var(--gray)]">Grootte: </span>
                    {project.size}
                  </p>
                  <p>
                    <span className="text-[var(--gray)]">Status: </span>
                    {project.status === "active" ? "Actief" : "Gearchiveerd"}
                  </p>
                  <p className="pt-2 text-[var(--gray-dark)]">{project.description}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-[var(--navy)]">Kerncijfers</CardTitle>
                  <CardDescription>Live uit dit project</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg bg-[var(--blue-light)] p-4">
                    <p className="text-2xl font-bold text-[var(--navy)]">
                      {analysesCount}
                    </p>
                    <p className="text-xs text-[var(--gray)]">Analyses</p>
                  </div>
                  <div className="rounded-lg bg-[var(--blue-light)] p-4">
                    <p className="text-2xl font-bold text-[var(--navy)]">
                      {reports.length}
                    </p>
                    <p className="text-xs text-[var(--gray)]">Rapporten</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analyses">
            {analyses.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[var(--navy)]">Nog geen analyses</CardTitle>
                  <CardDescription>Start een analyse op basis van een model.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href={`/projects/${id}/analyses/new`}>Model kiezen</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-2">
                {analyses.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--gray-light)] bg-white p-4"
                  >
                    <div>
                      <p className="font-medium text-[var(--navy)]">{a.modelName}</p>
                      <p className="text-xs text-[var(--gray)]">
                        {new Date(a.createdAt).toLocaleString("nl-NL")} · {a.status}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${id}/analyses/view/${a.id}`}>Bekijken</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[var(--navy)]">Nog geen rapporten</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href={`/projects/${id}/reports/new`}>Rapport genereren</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-2">
                {reports.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-4"
                  >
                    <div>
                      <p className="font-medium text-[var(--navy)]">
                        {r.title ?? REPORT_LABELS[r.reportType] ?? r.reportType}
                      </p>
                      <p className="text-xs text-[var(--gray)]">
                        {new Date(r.createdAt).toLocaleString("nl-NL")}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/projects/${id}/reports/view/${r.id}`}>Openen</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="chat">
            <ChatInterface projectId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
