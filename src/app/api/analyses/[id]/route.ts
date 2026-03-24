import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { analyses, projects } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const db = getDb();
    const row = await db
      .select({
        analysis: analyses,
        projectUserId: projects.userId,
      })
      .from(analyses)
      .innerJoin(projects, eq(analyses.projectId, projects.id))
      .where(eq(analyses.id, id))
      .limit(1);

    const found = row[0];
    if (!found || found.projectUserId !== user.id) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }

    return NextResponse.json({ analysis: found.analysis });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const db = getDb();
    const row = await db
      .select({
        analysis: analyses,
        projectUserId: projects.userId,
      })
      .from(analyses)
      .innerJoin(projects, eq(analyses.projectId, projects.id))
      .where(eq(analyses.id, id))
      .limit(1);

    const found = row[0];
    if (!found || found.projectUserId !== user.id) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }

    await db.delete(analyses).where(eq(analyses.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
