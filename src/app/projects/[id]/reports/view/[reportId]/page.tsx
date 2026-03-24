"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ReportViewer } from "@/components/reports/report-viewer";
import { pdfThemeFromBrandStyle } from "@/lib/brand-theme";
import type { BrandStyle } from "@/db/schema";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const REPORT_LABELS: Record<string, string> = {
  quick_scan: "Quick Scan",
  deep_dive: "Deep Dive",
  executive: "Executive Summary",
  full: "Full Advisory Report",
};

type ReportApi = {
  id: string;
  reportType: string;
  title: string | null;
  content: string;
  projectId: string;
};

export default function ReportViewPage() {
  const params = useParams();
  const projectId = String(params.id);
  const reportId = String(params.reportId);
  const [report, setReport] = useState<ReportApi | null>(null);
  const [orgName, setOrgName] = useState("");
  const [projectBrandStyle, setProjectBrandStyle] = useState<BrandStyle | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [rp, pr] = await Promise.all([
          fetch(`/api/reports/${reportId}`),
          fetch(`/api/projects/${projectId}`),
        ]);
        const rj = (await rp.json()) as { report?: ReportApi; error?: string };
        const pj = (await pr.json()) as {
          project?: { organizationName: string };
          brandStyle?: BrandStyle | null;
          error?: string;
        };
        if (!rp.ok) throw new Error(rj.error ?? "Rapport niet gevonden");
        if (!pr.ok) throw new Error(pj.error ?? "Project niet gevonden");
        if (cancelled) return;
        setReport(rj.report ?? null);
        setOrgName(pj.project?.organizationName ?? "");
        setProjectBrandStyle(pj.brandStyle ?? null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fout");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, projectId]);

  const typeLabel = report
    ? REPORT_LABELS[report.reportType] ?? report.reportType
    : "";

  return (
    <>
      <AppHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projecten", href: "/projects" },
          { label: "Project", href: `/projects/${projectId}` },
          { label: report?.title ?? "Rapport" },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}`}>Terug</Link>
          </Button>
        }
      />
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--gray)]" />
          </div>
        ) : report ? (
          <ReportViewer
            title={report.title ?? typeLabel}
            organizationName={orgName || "Organisatie"}
            reportTypeLabel={typeLabel}
            documentContent={report.content}
            reportId={report.id}
            pdfTheme={pdfThemeFromBrandStyle(projectBrandStyle)}
            onContentUpdated={(html) =>
              setReport((r) => (r ? { ...r, content: html } : r))
            }
          />
        ) : (
          <p className="text-[var(--gray)]">Rapport niet gevonden.</p>
        )}
      </div>
    </>
  );
}
