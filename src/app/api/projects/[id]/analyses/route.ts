import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { analyses, projects } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id: projectId } = await context.params;
    const db = getDb();

    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .limit(1);

    if (!project[0]) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }

    const list = await db
      .select()
      .from(analyses)
      .where(eq(analyses.projectId, projectId))
      .orderBy(desc(analyses.createdAt));

    return NextResponse.json({ analyses: list });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
