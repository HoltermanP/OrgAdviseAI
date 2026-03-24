"use client";

import { Loader2 } from "lucide-react";
import { AnalysisResult } from "@/components/analyses/analysis-result";
import type { AnalysisOutput } from "@/lib/analysis-output";

type StreamingResultProps = {
  streamingText: string;
  isComplete: boolean;
  parsedOutput: AnalysisOutput | null;
  error?: string | null;
};

export function StreamingResult({
  streamingText,
  isComplete,
  parsedOutput,
  error,
}: StreamingResultProps) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  if (isComplete && parsedOutput) {
    return <AnalysisResult data={parsedOutput} />;
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-[var(--blue)]/40 bg-[var(--blue-light)]/50 p-6">
      <div className="flex items-center gap-2 text-[var(--navy)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Analyse wordt gestreamd…</span>
      </div>
      <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--gray-dark)]">
        {streamingText || "Wachten op eerste tokens…"}
      </pre>
    </div>
  );
}
