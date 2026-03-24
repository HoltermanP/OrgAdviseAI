import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { brandStyles } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { z } from "zod";

const createBodySchema = z.object({
  name: z.string().min(1),
  accentColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  mutedColor: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  footerText: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireDbUser();
    const db = getDb();
    const rows = await db
      .select()
      .from(brandStyles)
      .where(eq(brandStyles.userId, user.id))
      .orderBy(desc(brandStyles.updatedAt));
    return NextResponse.json({ brandStyles: rows });
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
      .insert(brandStyles)
      .values({
        userId: user.id,
        name: body.name,
        accentColor: body.accentColor,
        secondaryColor: body.secondaryColor,
        mutedColor: body.mutedColor,
        logoUrl: body.logoUrl ?? undefined,
        footerText: body.footerText ?? "",
        updatedAt: now,
      })
      .returning();
    return NextResponse.json({ brandStyle: created });
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
