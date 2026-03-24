import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { analyses, projects } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { z } from "zod";

const createBodySchema = z.object({
  name: z.string().min(1),
  organizationName: z.string().min(1),
  sector: z.string().min(1),
  size: z.string().min(1),
  description: z.string().optional().default(""),
  status: z.enum(["active", "archived"]).optional().default("active"),
});

export async function GET() {
  try {
    const user = await requireDbUser();
    const db = getDb();
    const rows = await db
      .select({
        project: projects,
        analysisCount: sql<number>`count(${analyses.id})::int`,
      })
      .from(projects)
      .leftJoin(analyses, eq(analyses.projectId, projects.id))
      .where(eq(projects.userId, user.id))
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt));

    const list = rows.map((r) => ({
      ...r.project,
      analysisCount: r.analysisCount,
    }));

    return NextResponse.json({ projects: list });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireDbUser();
    const json: unknown = await req.json();
    const body = createBodySchema.parse(json);
    const db = getDb();
    const now = new Date();
    const [created] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name: body.name,
        organizationName: body.organizationName,
        sector: body.sector,
        size: body.size,
        description: body.description,
        status: body.status,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      return NextResponse.json(
        { error: "Project kon niet worden aangemaakt." },
        { status: 500 },
      );
    }

    return NextResponse.json({ project: created });
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
