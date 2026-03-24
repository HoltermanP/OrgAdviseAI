import { getDb } from "@/db";
import { analyses, projects } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { CLAUDE_MODEL, getAnthropicClient } from "@/lib/claude";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const bodySchema = z.object({
  projectId: z.string().uuid(),
  messages: z.array(messageSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const user = await requireDbUser();
    const json: unknown = await req.json();
    const body = bodySchema.parse(json);
    const db = getDb();

    const projectRow = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, body.projectId), eq(projects.userId, user.id)))
      .limit(1);

    const project = projectRow[0];
    if (!project) {
      return new Response(JSON.stringify({ error: "Project niet gevonden." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const analysisRows = await db
      .select()
      .from(analyses)
      .where(
        and(
          eq(analyses.projectId, body.projectId),
          eq(analyses.status, "completed"),
        ),
      );

    const contextPayload = analysisRows.map((a) => ({
      model: a.modelName,
      findings: a.outputData,
    }));

    const system = `You are an organizational advisor assistant for ${project.organizationName}.
You have access to ${analysisRows.length} completed analyses for this organization.
Analyses context: ${JSON.stringify(contextPayload)}
Answer in Dutch unless the user writes in another language. Be concise and practical.`;

    const client = getAnthropicClient();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: 2000,
            system,
            messages: body.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Chatfout.";
          controller.enqueue(encoder.encode(`\n[Fout] ${msg}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Ongeldige invoer.", details: e.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const message = e instanceof Error ? e.message : "Onbekende fout";
    const status = message === "Niet ingelogd." ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
