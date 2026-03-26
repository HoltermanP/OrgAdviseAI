import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  actionPlanItems,
  analyses,
  projects,
} from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import {
  actionPrioritySchema,
  actionStatusSchema,
  parseDueAtInput,
  serializeActionItem,
} from "@/lib/action-plan";
import { analysisOutputSchema } from "@/lib/analysis-output";
import { stripHtmlToPlainText } from "@/lib/report-html-to-gamma-text";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const postBodySchema = z
  .object({
    title: z.string().min(1).max(4000).optional(),
    description: z.string().max(16_000).optional().default(""),
    sourceAnalysisId: z.string().uuid().optional(),
    sourceRecommendationIndex: z.number().int().min(0).optional(),
    owner: z.string().max(500).optional().default(""),
    priority: actionPrioritySchema.optional().default("medium"),
    status: actionStatusSchema.optional().default("todo"),
    dueAt: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    const hasManual = data.title != null && data.title.trim().length > 0;
    const hasRec =
      data.sourceAnalysisId != null && data.sourceRecommendationIndex != null;
    if (!hasManual && !hasRec) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Geef een titel of een bronanalyse met aanbevelingsindex.",
        path: ["title"],
      });
    }
    const a = data.sourceAnalysisId != null;
    const b = data.sourceRecommendationIndex != null;
    if (a !== b) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Bronanalyse en aanbevelingsindex horen samen te worden meegegeven.",
        path: ["sourceAnalysisId"],
      });
    }
  });

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
    const { id: projectId } = await context.params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const db = getDb();
    const rows = await db
      .select()
      .from(actionPlanItems)
      .where(eq(actionPlanItems.projectId, projectId))
      .orderBy(
        sql`CASE WHEN ${actionPlanItems.status} = 'proposed' THEN 0 ELSE 1 END`,
        desc(actionPlanItems.updatedAt),
      );

    return NextResponse.json({
      items: rows.map(serializeActionItem),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id: projectId } = await context.params;
    const project = await getOwnedProject(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const json: unknown = await req.json();
    const body = postBodySchema.parse(json);
    const dueAt = parseDueAtInput(body.dueAt);
    const now = new Date();

    let title = body.title?.trim() ?? "";
    let description = body.description ?? "";
    const sourceAnalysisId: string | null = body.sourceAnalysisId ?? null;
    const sourceRecommendationIndex: number | null =
      body.sourceRecommendationIndex ?? null;

    if (sourceAnalysisId != null && sourceRecommendationIndex != null) {
      const db = getDb();
      const row = await db
        .select({ analysis: analyses })
        .from(analyses)
        .where(
          and(
            eq(analyses.id, sourceAnalysisId),
            eq(analyses.projectId, projectId),
          ),
        )
        .limit(1);
      const analysis = row[0]?.analysis;
      if (!analysis || analysis.status !== "completed") {
        return NextResponse.json(
          { error: "Analyse niet gevonden of nog niet voltooid." },
          { status: 400 },
        );
      }
      const parsed = analysisOutputSchema.safeParse(analysis.outputData);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Analyse-resultaat kan niet worden gelezen." },
          { status: 400 },
        );
      }
      const rec = parsed.data.recommendations[sourceRecommendationIndex];
      if (!rec) {
        return NextResponse.json(
          { error: "Aanbeveling bestaat niet op dit index." },
          { status: 400 },
        );
      }
      title = stripHtmlToPlainText(rec.title).slice(0, 4000);
      description = stripHtmlToPlainText(rec.description).slice(0, 16_000);
      if (!title.length) {
        title = `Aanbeveling ${sourceRecommendationIndex + 1}`;
      }
    }

    if (!title.length) {
      return NextResponse.json({ error: "Titel ontbreekt." }, { status: 400 });
    }

    const db = getDb();
    const [inserted] = await db
      .insert(actionPlanItems)
      .values({
        projectId,
        sourceAnalysisId,
        sourceRecommendationIndex,
        title,
        description,
        owner: body.owner.trim(),
        priority: body.priority,
        status: body.status,
        dueAt: dueAt === undefined ? null : dueAt,
        updatedAt: now,
      })
      .returning();

    if (!inserted) {
      return NextResponse.json(
        { error: "Actie kon niet worden opgeslagen." },
        { status: 500 },
      );
    }

    return NextResponse.json({ item: serializeActionItem(inserted) });
  } catch (e) {
    if (e instanceof z.ZodError) {
      const first = e.issues[0];
      return NextResponse.json(
        {
          error: first?.message ?? "Ongeldige invoer.",
          details: e.flatten(),
        },
        { status: 400 },
      );
    }
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
