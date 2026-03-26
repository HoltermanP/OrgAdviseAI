import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { actionPlanItems, projects } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import {
  actionPrioritySchema,
  actionStatusSchema,
  parseDueAtInput,
  serializeActionItem,
} from "@/lib/action-plan";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string; itemId: string }> };

const patchBodySchema = z.object({
  title: z.string().min(1).max(4000).optional(),
  description: z.string().max(16_000).optional(),
  owner: z.string().max(500).optional(),
  priority: actionPrioritySchema.optional(),
  status: actionStatusSchema.optional(),
  dueAt: z.unknown().optional().nullable(),
});

async function getOwnedActionItem(
  projectId: string,
  itemId: string,
  userId: string,
) {
  const db = getDb();
  const row = await db
    .select({
      item: actionPlanItems,
      projectUserId: projects.userId,
    })
    .from(actionPlanItems)
    .innerJoin(projects, eq(actionPlanItems.projectId, projects.id))
    .where(
      and(
        eq(actionPlanItems.id, itemId),
        eq(actionPlanItems.projectId, projectId),
      ),
    )
    .limit(1);
  const found = row[0];
  if (!found || found.projectUserId !== userId) {
    return null;
  }
  return found.item;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id: projectId, itemId } = await context.params;
    const existing = await getOwnedActionItem(projectId, itemId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const json: unknown = await req.json();
    const body = patchBodySchema.parse(json);

    const updates: Partial<typeof actionPlanItems.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.owner !== undefined) updates.owner = body.owner.trim();
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.status !== undefined) updates.status = body.status;
    if (body.dueAt !== undefined) {
      const d = parseDueAtInput(body.dueAt);
      updates.dueAt = d === undefined ? existing.dueAt : d;
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: "Geen velden om bij te werken." }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(actionPlanItems)
      .set(updates)
      .where(eq(actionPlanItems.id, itemId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Bijwerken mislukt." }, { status: 500 });
    }

    return NextResponse.json({ item: serializeActionItem(updated) });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: e.issues[0]?.message ?? "Ongeldige invoer.",
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

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id: projectId, itemId } = await context.params;
    const existing = await getOwnedActionItem(projectId, itemId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const db = getDb();
    await db.delete(actionPlanItems).where(eq(actionPlanItems.id, itemId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
