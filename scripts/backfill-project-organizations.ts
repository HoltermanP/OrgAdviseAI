/**
 * Koppelt bestaande projecten zonder organization_id aan een organisatierecord
 * (per gebruiker + organization_name). Maakt ontbrekende organisaties aan.
 *
 * Run: npx tsx scripts/backfill-project-organizations.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../src/db";
import { organizations, projects } from "../src/db/schema";

async function main() {
  const db = getDb();
  const orphans = await db
    .select()
    .from(projects)
    .where(isNull(projects.organizationId));

  let linked = 0;
  let createdOrgs = 0;

  for (const p of orphans) {
    const name = p.organizationName.trim() || "Organisatie (migratie)";
    const existing = await db
      .select()
      .from(organizations)
      .where(and(eq(organizations.userId, p.userId), eq(organizations.name, name)))
      .limit(1);

    let orgId: string;
    if (existing[0]) {
      orgId = existing[0].id;
    } else {
      const now = new Date();
      const [ins] = await db
        .insert(organizations)
        .values({
          userId: p.userId,
          name,
          sector: p.sector || "",
          size: p.size || "",
          description:
            "Automatisch aangemaakt bij migratie van een bestaand project.",
          updatedAt: now,
        })
        .returning();
      if (!ins) continue;
      orgId = ins.id;
      createdOrgs += 1;
    }

    await db
      .update(projects)
      .set({
        organizationId: orgId,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, p.id));
    linked += 1;
  }

  console.log(
    `Backfill klaar: ${linked} project(en) gekoppeld, ${createdOrgs} nieuwe organisatie(s).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
