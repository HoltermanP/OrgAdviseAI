import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { brandStyles } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { z } from "zod";

const patchBodySchema = z.object({
  name: z.string().min(1).optional(),
  accentColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  mutedColor: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  footerText: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const db = getDb();
    const row = await db
      .select()
      .from(brandStyles)
      .where(and(eq(brandStyles.id, id), eq(brandStyles.userId, user.id)))
      .limit(1);
    const found = row[0];
    if (!found) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    return NextResponse.json({ brandStyle: found });
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
    const existing = await db
      .select()
      .from(brandStyles)
      .where(and(eq(brandStyles.id, id), eq(brandStyles.userId, user.id)))
      .limit(1);
    if (!existing[0]) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const now = new Date();
    const [updated] = await db
      .update(brandStyles)
      .set({
        ...body,
        updatedAt: now,
      })
      .where(eq(brandStyles.id, id))
      .returning();
    return NextResponse.json({ brandStyle: updated });
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
    const db = getDb();
    const existing = await db
      .select()
      .from(brandStyles)
      .where(and(eq(brandStyles.id, id), eq(brandStyles.userId, user.id)))
      .limit(1);
    if (!existing[0]) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    await db.delete(brandStyles).where(eq(brandStyles.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
