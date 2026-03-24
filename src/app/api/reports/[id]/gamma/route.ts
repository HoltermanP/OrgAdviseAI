import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects, reports } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import {
  createGammaPresentation,
  getGammaGeneration,
} from "@/lib/gamma-client";
import { reportHtmlToGammaInputText } from "@/lib/report-html-to-gamma-text";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  try {
    if (!process.env.GAMMA_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "Gamma is niet geconfigureerd. Zet GAMMA_API_KEY in je omgeving (Gamma: Instellingen → API-sleutels).",
        },
        { status: 503 },
      );
    }

    const user = await requireDbUser();
    const { id } = await context.params;
    const db = getDb();
    const row = await db
      .select({
        report: reports,
        organizationName: projects.organizationName,
        ownerId: projects.userId,
      })
      .from(reports)
      .innerJoin(projects, eq(reports.projectId, projects.id))
      .where(eq(reports.id, id))
      .limit(1);

    const found = row[0];
    if (!found || found.ownerId !== user.id) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }

    const { text, usedSectionBreaks } = reportHtmlToGammaInputText(
      found.report.content,
    );
    if (!text) {
      return NextResponse.json(
        { error: "Rapport heeft geen inhoud om te presenteren." },
        { status: 400 },
      );
    }

    const { generationId } = await createGammaPresentation({
      inputText: text,
      usedSectionBreaks,
      organizationName: found.organizationName,
      reportTitle: found.report.title ?? found.report.reportType,
    });

    return NextResponse.json({ generationId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: Request, context: RouteContext) {
  try {
    if (!process.env.GAMMA_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error:
            "Gamma is niet geconfigureerd. Zet GAMMA_API_KEY in je omgeving.",
        },
        { status: 503 },
      );
    }

    const user = await requireDbUser();
    const { id } = await context.params;
    const generationId = new URL(req.url).searchParams.get("generationId");
    if (!generationId?.trim()) {
      return NextResponse.json(
        { error: "Queryparameter generationId is verplicht." },
        { status: 400 },
      );
    }

    const db = getDb();
    const row = await db
      .select({ ownerId: projects.userId })
      .from(reports)
      .innerJoin(projects, eq(reports.projectId, projects.id))
      .where(eq(reports.id, id))
      .limit(1);

    const found = row[0];
    if (!found || found.ownerId !== user.id) {
      return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
    }

    const status = await getGammaGeneration(generationId.trim());
    return NextResponse.json({ status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
