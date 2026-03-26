"use client";

import { useParams } from "next/navigation";
import { ActionPlanPanel } from "@/components/action-plan/action-plan-panel";

export default function ProjectActionPlanPage() {
  const params = useParams();
  const projectId = String(params.id);
  return <ActionPlanPanel projectId={projectId} />;
}
