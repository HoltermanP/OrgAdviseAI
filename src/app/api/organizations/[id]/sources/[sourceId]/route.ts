import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { organizations, organizationSources } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";

type RouteContext = { params: Promise<{ id: string; sourceId: string }> };

const patchBodySchema = z.object({
  status: z.enum(["proposed", "approved", "rejected"]),
});

async function assertSourceAccess(params: {
  userId: string;
  organizationId: string;
  sourceId: string;
}) {
  const db = getDb();
  const row = await db
    .select({
      source: organizationSources,
      orgUserId: organizations.userId,
    })
    .from(organizationSources)
    .innerJoin(organizations, eq(organizationSources.organizationId, organizations.id))
    .where(
      and(
        eq(organizationSources.id, params.sourceId),
        eq(organizationSources.organizationId, params.organizationId),
      ),
    )
    .limit(1);
  const found = row[0];
  if (!found || found.orgUserId !== params.userId) return null;
  return found.source;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id: organizationId, sourceId } = await context.params;
    const source = await assertSourceAccess({ userId: user.id, organizationId, sourceId });
    if (!source) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });

    const body = patchBodySchema.parse(await req.json());
    const db = getDb();
    const [updated] = await db
      .update(organizationSources)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(organizationSources.id, sourceId))
      .returning();

    if (body.status === "approved" && updated) {
      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);
      const current = org[0]?.approvedSourceUrls ?? [];
      if (!current.includes(updated.url)) {
        await db
          .update(organizations)
          .set({
            approvedSourceUrls: [...current, updated.url],
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, organizationId));
      }
    }
    return NextResponse.json({ source: updated });
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
    const { id: organizationId, sourceId } = await context.params;
    const source = await assertSourceAccess({ userId: user.id, organizationId, sourceId });
    if (!source) return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    const db = getDb();
    await db.delete(organizationSources).where(eq(organizationSources.id, sourceId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
