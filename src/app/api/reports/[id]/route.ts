import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects, reports } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const patchBodySchema = z.object({
  content: z.string(),
});

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const db = getDb();
    const row = await db
      .select({
        report: reports,
        ownerId: projects.userId,
      })
      .from(reports)
      .innerJoin(projects, eq(reports.projectId, projects.id))
      .where(eq(reports.id, id))
      .limit(1);

    const found = row[0];
    if (!found || found.ownerId !== user.id) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }

    return NextResponse.json({ report: found.report });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const json: unknown = await req.json();
    const body = patchBodySchema.parse(json);
    const db = getDb();
    const row = await db
      .select({
        report: reports,
        ownerId: projects.userId,
      })
      .from(reports)
      .innerJoin(projects, eq(reports.projectId, projects.id))
      .where(eq(reports.id, id))
      .limit(1);

    const found = row[0];
    if (!found || found.ownerId !== user.id) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }

    const [updated] = await db
      .update(reports)
      .set({ content: body.content })
      .where(eq(reports.id, id))
      .returning();

    return NextResponse.json({ report: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ongeldige invoer.", details: e.flatten() },
        { status: 400 },
      );
    }
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
