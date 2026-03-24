import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { ADVISORY_MODELS } from "@/data/advisory-models";
import { getDb } from "@/db";
import { analyses, projects, reports } from "@/db/schema";
import { syncClerkUser, requireDbUser } from "@/lib/auth-user";
import { AppHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ModelCard } from "@/components/models/model-card";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const FEATURED = ADVISORY_MODELS.slice(0, 6);

export default async function DashboardPage() {
  await syncClerkUser();
  const user = await requireDbUser();
  const db = getDb();

  const [projRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(projects)
    .where(eq(projects.userId, user.id));

  const [anaRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(analyses)
    .innerJoin(projects, eq(analyses.projectId, projects.id))
    .where(eq(projects.userId, user.id));

  const [repRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(reports)
    .innerJoin(projects, eq(reports.projectId, projects.id))
    .where(eq(projects.userId, user.id));

  const recent = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt))
    .limit(5);

  const recentWithCounts = await Promise.all(
    recent.map(async (p) => {
      const [r] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(analyses)
        .where(eq(analyses.projectId, p.id));
      return { ...p, analysisCount: r?.c ?? 0 };
    }),
  );

  const totalProjects = projRow?.c ?? 0;
  const totalAnalyses = anaRow?.c ?? 0;
  const totalReports = repRow?.c ?? 0;
  const empty = totalProjects === 0;

  return (
    <>
      <AppHeader
        items={[{ label: "Dashboard" }]}
        actions={
          <Button asChild className="bg-[var(--blue)] hover:bg-[var(--blue)]/90">
            <Link href="/projects">
              <Plus className="mr-2 h-4 w-4" />
              Nieuw project
            </Link>
          </Button>
        }
      />
      <div className="flex-1 space-y-8 p-6">
        {empty ? (
          <Card className="border-dashed border-[var(--blue)]/40 bg-[var(--blue-light)]/40">
            <CardHeader>
              <CardTitle className="text-[var(--navy)]">Welkom bij OrgAdvisor AI</CardTitle>
              <CardDescription>
                Je hebt nog geen projecten. Start met een eerste organisatiecase om analyses
                en rapporten te draaien.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-[var(--navy)] hover:bg-[var(--navy)]/90">
                <Link href="/projects">Project aanmaken</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Projecten", value: totalProjects },
            { label: "Analyses", value: totalAnalyses },
            { label: "Rapporten", value: totalReports },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl text-[var(--navy)]">{s.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--navy)]">
              Recente projecten
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">Alle projecten</Link>
            </Button>
          </div>
          {recentWithCounts.length === 0 ? (
            <p className="text-sm text-[var(--gray)]">Nog geen projecten.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentWithCounts.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-[var(--navy)]">{p.name}</CardTitle>
                    <CardDescription>
                      {p.organizationName} · {p.sector}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--blue-light)] px-2 py-0.5 text-xs text-[var(--navy)]">
                      {p.analysisCount} analyses
                    </span>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/projects/${p.id}`}>Openen</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${p.id}/analyses/new`}>Nieuwe analyse</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-[var(--navy)]">
            Uitgelichte modellen
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((m) => (
              <ModelCard key={m.id} model={m} href="/models" />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
