import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { analyses, brandStyles, organizations, projects } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { z } from "zod";

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  organizationName: z.string().min(1).optional(),
  sector: z.string().min(1).optional(),
  size: z.string().min(1).optional(),
  description: z.string().optional(),
  projectGoals: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
  brandStyleId: z.union([z.string().uuid(), z.null()]).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedProject(projectId: string, userId: string) {
  const db = getDb();
  const row = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return row[0] ?? null;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const db = getDb();
    const row = await db
      .select({
        project: projects,
        brandStyle: brandStyles,
        organization: organizations,
      })
      .from(projects)
      .leftJoin(brandStyles, eq(projects.brandStyleId, brandStyles.id))
      .leftJoin(organizations, eq(projects.organizationId, organizations.id))
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .limit(1);
    const found = row[0];
    if (!found) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const [countRow] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(analyses)
      .where(eq(analyses.projectId, id));

    return NextResponse.json({
      project: {
        ...found.project,
        organizationName: found.organization?.name ?? found.project.organizationName,
        sector: found.organization?.sector || found.project.sector,
        size: found.organization?.size || found.project.size,
      },
      brandStyle: found.brandStyle,
      analysesCount: countRow?.c ?? 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const project = await getOwnedProject(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const json: unknown = await req.json();
    const body = updateBodySchema.parse(json);
    const db = getDb();
    if (body.brandStyleId) {
      const style = await db
        .select()
        .from(brandStyles)
        .where(
          and(
            eq(brandStyles.id, body.brandStyleId),
            eq(brandStyles.userId, user.id),
          ),
        )
        .limit(1);
      if (!style[0]) {
        return NextResponse.json(
          { error: "Huisstijl niet gevonden of niet van jou." },
          { status: 400 },
        );
      }
    }
    const now = new Date();
    const [updated] = await db
      .update(projects)
      .set({
        ...body,
        updatedAt: now,
      })
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json({ project: updated });
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

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const project = await getOwnedProject(id, user.id);
    if (!project) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const db = getDb();
    await db.delete(projects).where(eq(projects.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
