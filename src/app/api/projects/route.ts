import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { analyses, organizations, projects } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { z } from "zod";

const createBodySchema = z.object({
  name: z.string().min(1),
  organizationId: z.string().uuid(),
  description: z.string().optional().default(""),
  projectGoals: z.string().optional().default(""),
  status: z.enum(["active", "archived"]).optional().default("active"),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireDbUser();
    const organizationId = req.nextUrl.searchParams.get("organizationId");
    const db = getDb();

    const filters = [eq(projects.userId, user.id)];
    if (organizationId === "__none__") {
      filters.push(isNull(projects.organizationId));
    } else if (organizationId && organizationId !== "__all__") {
      filters.push(eq(projects.organizationId, organizationId));
    }

    const rows = await db
      .select({
        project: projects,
        organization: organizations,
        analysisCount: sql<number>`count(${analyses.id})::int`,
      })
      .from(projects)
      .leftJoin(organizations, eq(projects.organizationId, organizations.id))
      .leftJoin(analyses, eq(analyses.projectId, projects.id))
      .where(and(...filters))
      .groupBy(projects.id, organizations.id)
      .orderBy(desc(projects.updatedAt));

    const list = rows.map((r) => ({
      ...r.project,
      organizationName: r.organization?.name ?? r.project.organizationName,
      sector: r.organization?.sector || r.project.sector,
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
    const orgRow = await db
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, body.organizationId),
          eq(organizations.userId, user.id),
        ),
      )
      .limit(1);
    const org = orgRow[0];
    if (!org) {
      return NextResponse.json({ error: "Organisatie niet gevonden." }, { status: 404 });
    }
    const now = new Date();
    const [created] = await db
      .insert(projects)
      .values({
        userId: user.id,
        organizationId: org.id,
        name: body.name,
        organizationName: org.name,
        sector: org.sector || "Onbekend",
        size: org.size || "Onbekend",
        description: body.description,
        projectGoals: body.projectGoals,
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
