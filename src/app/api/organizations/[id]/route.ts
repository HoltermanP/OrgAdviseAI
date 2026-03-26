import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { organizations, organizationSources } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";

type RouteContext = { params: Promise<{ id: string }> };

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  website: z.string().url().optional().or(z.literal("")),
  sector: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  businessModel: z.string().optional(),
  keyProducts: z.string().optional(),
  marketScope: z.string().optional(),
  headquarters: z.string().optional(),
});

async function getOwnedOrganization(id: string, userId: string) {
  const db = getDb();
  const row = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.id, id), eq(organizations.userId, userId)))
    .limit(1);
  return row[0] ?? null;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const org = await getOwnedOrganization(id, user.id);
    if (!org) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const db = getDb();
    const sources = await db
      .select()
      .from(organizationSources)
      .where(eq(organizationSources.organizationId, id));
    return NextResponse.json({ organization: org, sources });
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
    const existing = await getOwnedOrganization(id, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const body = updateBodySchema.parse(await req.json());
    const db = getDb();
    const [updated] = await db
      .update(organizations)
      .set({
        ...body,
        website: body.website === undefined ? undefined : body.website.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();
    return NextResponse.json({ organization: updated });
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
