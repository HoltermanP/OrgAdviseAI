export const MODEL_CATEGORIES = [
  { key: "strategy", label: "Strategy", color: "#534AB7" },
  { key: "organization", label: "Organization", color: "#0F6E56" },
  { key: "processes", label: "Processes", color: "#185FA5" },
  { key: "change", label: "Change", color: "#993C1D" },
  { key: "culture", label: "Culture", color: "#993556" },
  { key: "leadership", label: "Leadership", color: "#3B6D11" },
  { key: "hr_talent", label: "HR & Talent", color: "#854F0B" },
  { key: "innovation", label: "Innovation", color: "#A32D2D" },
  { key: "project", label: "Project", color: "#5F5E5A" },
  { key: "finance", label: "Finance", color: "#0F447C" },
] as const;

export type ModelCategory = (typeof MODEL_CATEGORIES)[number]["key"];

export function getCategoryMeta(key: string) {
  return MODEL_CATEGORIES.find((c) => c.key === key) ?? MODEL_CATEGORIES[0];
}
