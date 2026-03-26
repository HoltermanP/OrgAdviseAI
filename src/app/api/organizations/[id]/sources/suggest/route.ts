import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { organizations, organizationSources } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { suggestOrganizationSources } from "@/lib/organization-research";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedOrganization(id: string, userId: string) {
  const db = getDb();
  const row = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.id, id), eq(organizations.userId, userId)))
    .limit(1);
  return row[0] ?? null;
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const org = await getOwnedOrganization(id, user.id);
    if (!org) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }
    const suggestions = await suggestOrganizationSources({
      organizationName: org.name,
      sector: org.sector,
    });

    const db = getDb();
    const existing = await db
      .select()
      .from(organizationSources)
      .where(eq(organizationSources.organizationId, org.id));
    const existingUrls = new Set(existing.map((s) => s.url));

    const toInsert = suggestions
      .filter((s) => !existingUrls.has(s.url))
      .map((s) => ({
        organizationId: org.id,
        url: s.url,
        title: s.title,
        excerpt: s.excerpt,
        status: "proposed",
        updatedAt: new Date(),
      }));

    if (toInsert.length > 0) {
      await db.insert(organizationSources).values(toInsert);
    }

    const refreshed = await db
      .select()
      .from(organizationSources)
      .where(eq(organizationSources.organizationId, org.id));

    return NextResponse.json({ sources: refreshed, insertedCount: toInsert.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
