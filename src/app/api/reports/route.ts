import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { analyses, projects, reports } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { CLAUDE_MODEL, getAnthropicClient } from "@/lib/claude";
import { z } from "zod";

const postBodySchema = z.object({
  projectId: z.string().uuid(),
  reportType: z.enum(["quick_scan", "deep_dive", "executive", "full"]),
  selectedAnalysisIds: z.array(z.string().uuid()).min(1),
  stream: z.boolean().optional().default(false),
});

const REPORT_TYPE_INSTRUCTION: Record<
  z.infer<typeof postBodySchema>["reportType"],
  string
> = {
  quick_scan:
    "Schrijf een beknopt quick scan rapport (max. 2 pagina's equivalent), hoog niveau, bullet-gedreven waar passend.",
  deep_dive:
    "Schrijf een diepgaand rapport met argumentatie, nuances en onderbouwing per thema.",
  executive:
    "Schrijf een executive summary: besluitgericht, maximaal 1 pagina kern, duidelijke aanbevelingen.",
  full: "Schrijf een volledig adviesrapport met inleiding, bevindingen per analyse, risico's, aanbevelingen en vervolgstappen.",
};

function buildReportSystemPrompt(
  organizationName: string,
  reportType: keyof typeof REPORT_TYPE_INSTRUCTION,
  payload: { modelName: string; output: unknown }[],
): string {
  return `Je bent een senior organisatieadviseur. Je schrijft een professioneel rapport voor ${organizationName}.
Stijl: zakelijk Nederlands, helder, concreet. ${REPORT_TYPE_INSTRUCTION[reportType]}
Huisstijl: AI-Group.nl. Schrijf met een moderne, adviesgerichte tone-of-voice.
Neem direct onder de titel een subtiele merkregel op: "AI-Group.nl - AI-first - we ship fast.".

Brondata (voltooide analyses als JSON):
${JSON.stringify(payload, null, 2)}

Lever de volledige rapporttekst als geldige semantische HTML (één fragment, geen <html> of <body>).
Structuur: begin met <article>. Gebruik <section> per hoofdstuk, met eerst <h2> voor de sectietitel, daarna <p>, <ul>/<li>, <ol>/<li>, <h3> waar nodig, <strong> en <em> voor nadruk.
Geen <script>, <style>, inline styles of iframes. Geen JSON-output — alleen HTML.`;
}

export async function POST(req: Request) {
  try {
    const user = await requireDbUser();
    const json: unknown = await req.json();
    const body = postBodySchema.parse(json);
    const db = getDb();

    const projectRow = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, body.projectId), eq(projects.userId, user.id)))
      .limit(1);

    const project = projectRow[0];
    if (!project) {
      return NextResponse.json({ error: "Project niet gevonden." }, { status: 404 });
    }

    const analysisRows = await db
      .select()
      .from(analyses)
      .where(
        and(
          eq(analyses.projectId, body.projectId),
          inArray(analyses.id, body.selectedAnalysisIds),
        ),
      );

    if (analysisRows.length !== body.selectedAnalysisIds.length) {
      return NextResponse.json(
        { error: "Een of meer analyses horen niet bij dit project." },
        { status: 400 },
      );
    }

    const payload = analysisRows.map((a) => ({
      modelName: a.modelName,
      output: a.outputData,
    }));

    const system = buildReportSystemPrompt(
      project.organizationName,
      body.reportType,
      payload,
    );

    const userMessage = `Organisatie: ${project.organizationName}
Sector: ${project.sector}
Grootte: ${project.size}
Context: ${project.description}

Genereer het gevraagde rapport op basis van de analyses.`;

    if (body.stream) {
      const client = getAnthropicClient();
      const encoder = new TextEncoder();
      const [inserted] = await db
        .insert(reports)
        .values({
          projectId: body.projectId,
          reportType: body.reportType,
          title: `${body.reportType} — ${project.organizationName}`,
          content: "",
          selectedAnalysisIds: body.selectedAnalysisIds,
        })
        .returning();

      if (!inserted) {
        return NextResponse.json(
          { error: "Rapport kon niet worden gestart." },
          { status: 500 },
        );
      }

      const reportId = inserted.id;
      let fullText = "";

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const anthropicStream = await client.messages.stream({
              model: CLAUDE_MODEL,
              max_tokens: 8000,
              system,
              messages: [{ role: "user", content: userMessage }],
            });

            for await (const event of anthropicStream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                fullText += event.delta.text;
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "chunk",
                      text: event.delta.text,
                    })}\n\n`,
                  ),
                );
              }
            }

            await db
              .update(reports)
              .set({ content: fullText })
              .where(eq(reports.id, reportId));

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  reportId,
                })}\n\n`,
              ),
            );
            controller.close();
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Rapport genereren mislukt.";
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", message: msg })}\n\n`,
              ),
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const content =
      textBlock && textBlock.type === "text" ? textBlock.text : "";

    const [created] = await db
      .insert(reports)
      .values({
        projectId: body.projectId,
        reportType: body.reportType,
        title: `${body.reportType} — ${project.organizationName}`,
        content,
        selectedAnalysisIds: body.selectedAnalysisIds,
      })
      .returning();

    return NextResponse.json({ report: created });
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
