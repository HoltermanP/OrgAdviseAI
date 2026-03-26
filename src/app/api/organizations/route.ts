import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { organizations } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";

const createBodySchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional().or(z.literal("")).default(""),
  sector: z.string().optional().default(""),
  size: z.string().optional().default(""),
  description: z.string().optional().default(""),
  businessModel: z.string().optional().default(""),
  keyProducts: z.string().optional().default(""),
  marketScope: z.string().optional().default(""),
  headquarters: z.string().optional().default(""),
});

export async function GET() {
  try {
    const user = await requireDbUser();
    const db = getDb();
    const rows = await db
      .select()
      .from(organizations)
      .where(eq(organizations.userId, user.id))
      .orderBy(desc(organizations.updatedAt));
    return NextResponse.json({ organizations: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireDbUser();
    const body = createBodySchema.parse(await req.json());
    const db = getDb();
    const [created] = await db
      .insert(organizations)
      .values({
        userId: user.id,
        ...body,
        website: body.website.trim() || null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ organization: created });
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
