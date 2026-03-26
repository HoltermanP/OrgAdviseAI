import { z } from "zod";

export const modelRecommendationSchema = z.object({
  modelId: z.string(),
  name: z.string(),
  fitScore: z.number().min(1).max(10),
  rationale: z.string(),
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
  expectedOutput: z.array(z.string()).min(1),
});

export const modelSelectionAdviceSchema = z.object({
  summary: z.string(),
  recommendations: z.array(modelRecommendationSchema).min(2).max(5),
  recommendedModelId: z.string(),
  recommendationReason: z.string(),
});

export type ModelSelectionAdvice = z.infer<typeof modelSelectionAdviceSchema>;

export function parseModelSelectionAdvice(raw: string): ModelSelectionAdvice {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed: unknown = JSON.parse(cleaned);
  return modelSelectionAdviceSchema.parse(parsed);
}
