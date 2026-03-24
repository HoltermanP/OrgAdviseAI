import { z } from "zod";

export const analysisOutputSchema = z.object({
  summary: z.string(),
  frameworkApplication: z.string(),
  keyFindings: z.array(z.string()),
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    }),
  ),
  riskFlags: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      detail: z.string(),
    }),
  ),
  implementationSteps: z.array(
    z.object({
      phase: z.string(),
      actions: z.array(z.string()),
    }),
  ),
  factualityLevel: z.enum(["strict", "balanced", "exploratory"]).default("balanced"),
  assumptionsUsed: z.array(z.string()).default([]),
  scenarioVariants: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .default([]),
  sources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        sourceType: z.enum(["user_input", "web_specific", "web_sector"]),
        excerpt: z.string().default(""),
      }),
    )
    .default([]),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;

export function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }
  return trimmed;
}

export function parseAnalysisOutput(raw: string): AnalysisOutput {
  const cleaned = stripJsonFences(raw);
  const parsed: unknown = JSON.parse(cleaned);
  return analysisOutputSchema.parse(parsed);
}
