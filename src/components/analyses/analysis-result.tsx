import type { AnalysisOutput } from "@/lib/analysis-output";
import { SafeHtml } from "@/components/safe-html";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ListOrdered, Sparkles } from "lucide-react";

type AnalysisResultProps = {
  data: AnalysisOutput;
};

const severityStyles = {
  low: "border-amber-200 bg-amber-50 text-amber-900",
  medium: "border-orange-300 bg-orange-50 text-orange-900",
  high: "border-red-300 bg-red-50 text-red-900",
} as const;

const compactHtmlClass =
  "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2";

export function AnalysisResult({ data }: AnalysisResultProps) {
  return (
    <div className="space-y-6">
      <Card className="border-[var(--blue)]/30 bg-[var(--blue-light)]">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Sparkles className="h-5 w-5 text-[var(--blue)]" />
          <div>
            <CardTitle className="text-[var(--navy)]">Samenvatting</CardTitle>
            <CardDescription>Kern van de analyse</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-[var(--gray-dark)]">
          <SafeHtml html={data.summary} className={compactHtmlClass} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[var(--navy)]">Toepassing van het kader</CardTitle>
        </CardHeader>
        <CardContent>
          <SafeHtml
            html={data.frameworkApplication}
            className={compactHtmlClass}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ListOrdered className="h-5 w-5 text-[var(--blue)]" />
          <CardTitle className="text-[var(--navy)]">Belangrijkste bevindingen</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-3 pl-5 text-[var(--gray-dark)]">
            {data.keyFindings.map((f, i) => (
              <li key={i} className="pl-1">
                <SafeHtml html={f} className={`${compactHtmlClass} [&_ol]:list-decimal`} />
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--navy)]">
          <CheckCircle2 className="h-5 w-5 text-[var(--blue)]" />
          Aanbevelingen
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {data.recommendations.map((r, i) => (
            <Card key={i} className="border-[var(--blue)]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-[var(--navy)]">
                  <SafeHtml html={r.title} className={compactHtmlClass} />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[var(--gray-dark)]">
                <SafeHtml html={r.description} className={compactHtmlClass} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--navy)]">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Risico&apos;s
        </h3>
        <div className="grid gap-3">
          {data.riskFlags.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 ${severityStyles[r.severity]}`}
            >
              <p className="font-medium">
                <SafeHtml html={r.title} className={compactHtmlClass} />
              </p>
              <div className="mt-1 text-sm opacity-90">
                <SafeHtml html={r.detail} className={compactHtmlClass} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold text-[var(--navy)]">
          Implementatiestappen
        </h3>
        <div className="space-y-4 border-l-2 border-[var(--blue)] pl-4">
          {data.implementationSteps.map((step, i) => (
            <div key={i}>
              <div className="font-medium text-[var(--gray-dark)]">
                <SafeHtml html={step.phase} className={compactHtmlClass} />
              </div>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[var(--gray)]">
                {step.actions.map((a, j) => (
                  <li key={j}>
                    <SafeHtml html={a} className={compactHtmlClass} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
