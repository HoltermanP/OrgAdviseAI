import type { Db } from "@/db";
import { actionPlanItems } from "@/db/schema";
import type { AnalysisOutput } from "@/lib/analysis-output";
import { stripHtmlToPlainText } from "@/lib/report-html-to-gamma-text";

/**
 * Voegt voor elke aanbeveling een actieplanregel toe met status `proposed`.
 * Fouten worden gelogd; caller bepaalt of de analyse alsnog succes is.
 */
export async function insertProposedActionItemsFromAnalysis(
  db: Db,
  params: {
    projectId: string;
    analysisId: string;
    output: AnalysisOutput;
  },
): Promise<void> {
  const { projectId, analysisId, output } = params;
  if (output.recommendations.length === 0) return;

  const now = new Date();
  const rows = output.recommendations.map((rec, index) => {
    const title = stripHtmlToPlainText(rec.title).slice(0, 4000);
    const description = stripHtmlToPlainText(rec.description).slice(0, 16_000);
    return {
      projectId,
      sourceAnalysisId: analysisId,
      sourceRecommendationIndex: index,
      title: title.length > 0 ? title : `Aanbeveling ${index + 1}`,
      description,
      owner: "",
      priority: "medium" as const,
      status: "proposed" as const,
      dueAt: null as null,
      updatedAt: now,
    };
  });

  await db.insert(actionPlanItems).values(rows);
}
