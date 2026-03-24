"use client";

import { pdf } from "@react-pdf/renderer";
import { Download, Loader2, Pencil, Presentation, Save, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { HtmlEditor } from "@/components/reports/html-editor";
import {
  ReportPdfDocument,
} from "@/components/reports/report-pdf-document";
import { SafeHtml } from "@/components/safe-html";
import { Button } from "@/components/ui/button";
import type { PdfBrandTheme } from "@/lib/brand-theme";
import { DEFAULT_PDF_THEME } from "@/lib/brand-theme";
import { normalizeDocumentHtml } from "@/lib/content-format";
import { contentToPdfSections } from "@/lib/html-to-pdf-blocks";

type ReportViewerProps = {
  title: string;
  organizationName: string;
  reportTypeLabel: string;
  /** Opgeslagen inhoud: HTML of legacy markdown. */
  documentContent: string;
  reportId?: string;
  pdfTheme?: PdfBrandTheme;
  onContentUpdated?: (html: string) => void;
};

export function ReportViewer({
  title,
  organizationName,
  reportTypeLabel,
  documentContent,
  reportId,
  pdfTheme,
  onContentUpdated,
}: ReportViewerProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(documentContent);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [gammaLoading, setGammaLoading] = useState(false);

  const theme = pdfTheme ?? DEFAULT_PDF_THEME;

  const displayHtml = useMemo(
    () => normalizeDocumentHtml(documentContent),
    [documentContent],
  );

  const handlePdf = useCallback(async () => {
    setDownloading(true);
    try {
      const sections = contentToPdfSections(documentContent);
      const doc = (
        <ReportPdfDocument
          organizationName={organizationName}
          reportTypeLabel={reportTypeLabel}
          generatedAt={new Date().toLocaleString("nl-NL")}
          sections={sections}
          theme={theme}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${organizationName}-${reportTypeLabel}.pdf`.replace(
        /\s+/g,
        "-",
      );
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF mislukt");
    } finally {
      setDownloading(false);
    }
  }, [documentContent, organizationName, reportTypeLabel, theme]);

  const startGammaPresentation = useCallback(async () => {
    if (!reportId) return;
    setGammaLoading(true);
    try {
      const start = await fetch(`/api/reports/${reportId}/gamma`, {
        method: "POST",
      });
      const startJson = (await start.json()) as {
        generationId?: string;
        error?: string;
      };
      if (!start.ok) {
        throw new Error(startJson.error ?? "Gamma start mislukt");
      }
      const genId = startJson.generationId;
      if (!genId) throw new Error("Geen generationId ontvangen");

      for (let i = 0; i < 120; i += 1) {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, 5000));
        }
        const poll = await fetch(
          `/api/reports/${reportId}/gamma?generationId=${encodeURIComponent(genId)}`,
        );
        const pollJson = (await poll.json()) as {
          status?: { status?: string; gammaUrl?: string };
          error?: string;
        };
        if (!poll.ok) {
          throw new Error(pollJson.error ?? "Gamma-status ophalen mislukt");
        }
        const st = pollJson.status?.status;
        if (st === "completed" && pollJson.status?.gammaUrl) {
          window.open(pollJson.status.gammaUrl, "_blank", "noopener,noreferrer");
          toast.success("Presentatie is klaar in Gamma");
          return;
        }
        if (st === "failed") {
          throw new Error("Generatie in Gamma is mislukt.");
        }
      }
      throw new Error("Timeout: Gamma deed er te lang over. Probeer later opnieuw.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gamma-fout");
    } finally {
      setGammaLoading(false);
    }
  }, [reportId]);

  async function save() {
    if (!reportId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Opslaan mislukt");
      onContentUpdated?.(draft);
      setEditing(false);
      toast.success("Rapport opgeslagen");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setDraft(documentContent);
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-[var(--navy)]">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {reportId && !editing ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(documentContent);
                setEditing(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Button>
          ) : null}
          {reportId && editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => cancelEdit()}
              >
                <X className="mr-2 h-4 w-4" />
                Annuleren
              </Button>
              <Button
                type="button"
                className="bg-[var(--navy)] text-white hover:bg-[var(--navy)]/90"
                disabled={saving}
                onClick={() => void save()}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Opslaan
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(
                editing ? draft : displayHtml,
              );
              toast.success("Gekopieerd");
            }}
          >
            Kopieer HTML
          </Button>
          <Button
            type="button"
            className="bg-[var(--navy)] text-white hover:bg-[var(--navy)]/90"
            disabled={downloading || !documentContent.trim()}
            onClick={() => void handlePdf()}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "PDF…" : "Download PDF"}
          </Button>
          {reportId ? (
            <Button
              type="button"
              variant="outline"
              disabled={
                gammaLoading || !documentContent.trim() || editing
              }
              onClick={() => void startGammaPresentation()}
            >
              {gammaLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Presentation className="mr-2 h-4 w-4" />
              )}
              {gammaLoading ? "Gamma…" : "Presentatie (Gamma)"}
            </Button>
          ) : null}
        </div>
      </div>
      {editing ? (
        <HtmlEditor value={draft} onChange={setDraft} disabled={saving} />
      ) : (
        <article className="max-w-none rounded-xl border border-[var(--gray-light)] bg-white p-6 shadow-sm">
          <SafeHtml html={displayHtml} />
        </article>
      )}
    </div>
  );
}
