import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { ADVISORY_MODEL_BY_ID } from "@/data/advisory-models";
import { getDb } from "@/db";
import { analyses, projects } from "@/db/schema";
import { parseAnalysisOutput } from "@/lib/analysis-output";
import { requireDbUser } from "@/lib/auth-user";
import { CLAUDE_MODEL, getAnthropicClient } from "@/lib/claude";
import { z } from "zod";

const postBodySchema = z.object({
  projectId: z.string().uuid(),
  modelId: z.string().min(1),
  inputData: z.record(z.string(), z.unknown()),
  stream: z.boolean().optional().default(false),
});

function buildUserContent(
  organizationName: string,
  sector: string,
  size: string,
  description: string,
  inputData: Record<string, unknown>,
): string {
  return `Organization: ${organizationName}
Sector: ${sector}
Size: ${size}
Challenge: ${description}

Input data:
${JSON.stringify(inputData, null, 2)}`;
}

async function assertProjectAccess(
  projectId: string,
  userId: string,
): Promise<typeof projects.$inferSelect> {
  const db = getDb();
  const row = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!row[0]) {
    throw new Error("Project niet gevonden of geen toegang.");
  }
  return row[0];
}

export async function POST(req: Request) {
  try {
    const user = await requireDbUser();
    const json: unknown = await req.json();
    const body = postBodySchema.parse(json);
    const model = ADVISORY_MODEL_BY_ID[body.modelId];
    if (!model) {
      return NextResponse.json({ error: "Onbekend model." }, { status: 400 });
    }

    const project = await assertProjectAccess(body.projectId, user.id);
    const db = getDb();
    const now = new Date();

    const [pending] = await db
      .insert(analyses)
      .values({
        projectId: body.projectId,
        modelId: model.id,
        modelName: model.name,
        inputData: body.inputData,
        status: "running",
        outputData: null,
        updatedAt: now,
      })
      .returning();

    if (!pending) {
      return NextResponse.json(
        { error: "Analyse kon niet worden gestart." },
        { status: 500 },
      );
    }

    const userContent = buildUserContent(
      project.organizationName,
      project.sector,
      project.size,
      project.description,
      body.inputData,
    );

    if (body.stream) {
      const client = getAnthropicClient();
      const encoder = new TextEncoder();
      const analysisId = pending.id;

      const stream = new ReadableStream({
        async start(controller) {
          let buffer = "";
          try {
            const anthropicStream = await client.messages.stream({
              model: CLAUDE_MODEL,
              max_tokens: 4000,
              system: model.systemPrompt,
              messages: [
                {
                  role: "user",
                  content: userContent,
                },
              ],
            });

            for await (const event of anthropicStream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                buffer += event.delta.text;
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

            const parsed = parseAnalysisOutput(buffer);
            await db
              .update(analyses)
              .set({
                outputData: parsed,
                status: "completed",
                updatedAt: new Date(),
              })
              .where(eq(analyses.id, analysisId));

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  analysisId,
                  output: parsed,
                })}\n\n`,
              ),
            );
            controller.close();
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Analyse mislukt.";
            await db
              .update(analyses)
              .set({
                status: "failed",
                outputData: { error: msg },
                updatedAt: new Date(),
              })
              .where(eq(analyses.id, analysisId));
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
      max_tokens: 4000,
      system: model.systemPrompt,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw =
      textBlock && textBlock.type === "text" ? textBlock.text : "";
    const parsed = parseAnalysisOutput(raw);

    const [updated] = await db
      .update(analyses)
      .set({
        outputData: parsed,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(analyses.id, pending.id))
      .returning();

    return NextResponse.json({ analysis: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ongeldige invoer.", details: e.flatten() },
        { status: 400 },
      );
    }
    const message = e instanceof Error ? e.message : "Onbekende fout";
    if (message === "Niet ingelogd.") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("Project niet gevonden")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
