import { z } from "zod";
import type { ActionPlanItem } from "@/db/schema";

export const actionPrioritySchema = z.enum(["low", "medium", "high"]);
export const actionStatusSchema = z.enum([
  "proposed",
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);

export type ActionPriority = z.infer<typeof actionPrioritySchema>;
export type ActionStatus = z.infer<typeof actionStatusSchema>;

export function parseDueAtInput(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function serializeActionItem(row: ActionPlanItem) {
  return {
    id: row.id,
    projectId: row.projectId,
    sourceAnalysisId: row.sourceAnalysisId,
    sourceRecommendationIndex: row.sourceRecommendationIndex,
    title: row.title,
    description: row.description,
    owner: row.owner,
    priority: row.priority,
    status: row.status,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type SerializedActionPlanItem = ReturnType<typeof serializeActionItem>;
