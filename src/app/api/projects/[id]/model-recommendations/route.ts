import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ADVISORY_MODELS } from "@/data/advisory-models";
import { getDb } from "@/db";
import { organizations, projects } from "@/db/schema";
import { requireDbUser } from "@/lib/auth-user";
import { CLAUDE_MODEL, getAnthropicClient } from "@/lib/claude";
import {
  parseModelSelectionAdvice,
  type ModelSelectionAdvice,
} from "@/lib/model-recommendations";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    extraContext: z.string().optional(),
  })
  .optional();

function buildCatalogForPrompt(): string {
  return JSON.stringify(
    ADVISORY_MODELS.map((model) => ({
      id: model.id,
      name: model.name,
      category: model.categoryLabel,
      description: model.description,
      whenToUse: model.whenToUse,
    })),
    null,
    2,
  );
}

function sanitizeAdvice(advice: ModelSelectionAdvice): ModelSelectionAdvice {
  const validModelIds = new Set(ADVISORY_MODELS.map((model) => model.id));
  const valid = advice.recommendations.filter((rec) => validModelIds.has(rec.modelId));
  const deduped = valid.filter(
    (rec, index) => valid.findIndex((other) => other.modelId === rec.modelId) === index,
  );
  const fallbackRecommendations =
    deduped.length > 0
      ? deduped
      : ADVISORY_MODELS.slice(0, 3).map((model, index) => ({
          modelId: model.id,
          name: model.name,
          fitScore: 6 - index,
          rationale: "Algemene match bij beperkte context.",
          pros: ["Breed inzetbaar voor eerste probleemverkenning."],
          cons: ["Minder specifiek zonder extra context."],
          expectedOutput: ["Eerste hypothesen en richting voor vervolganalyse."],
        }));

  const fallback = fallbackRecommendations[0]?.modelId ?? "";
  const recommendedModelId = fallbackRecommendations.some(
    (rec) => rec.modelId === advice.recommendedModelId,
  )
    ? advice.recommendedModelId
    : fallback;

  return {
    ...advice,
    recommendations: fallbackRecommendations,
    recommendedModelId,
  };
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const user = await requireDbUser();
    const { id } = await context.params;
    const payload = bodySchema.parse((await req.json()) as unknown);
    const db = getDb();

    const row = await db
      .select({
        project: projects,
        organization: organizations,
      })
      .from(projects)
      .leftJoin(organizations, eq(projects.organizationId, organizations.id))
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .limit(1);

    if (!row[0]) {
      return NextResponse.json({ error: "Project niet gevonden." }, { status: 404 });
    }

    const project = row[0].project;
    const organization = row[0].organization;
    const organizationName = organization?.name ?? project.organizationName;
    const sector = organization?.sector ?? project.sector;
    const size = organization?.size ?? project.size;
    const challenge = project.description ?? "";
    const goals = project.projectGoals ?? "";

    const systemPrompt = `Je bent een senior organisatieadviseur.
Selecteer op basis van bedrijfscontext en vraagstuk de best passende adviesmodellen uit de catalogus.

Antwoord ALLEEN geldige JSON zonder markdown of code fences, met exact deze structuur:
{
  "summary": "korte samenvatting",
  "recommendations": [
    {
      "modelId": "string (moet exact bestaan in catalogus)",
      "name": "string",
      "fitScore": "number 1-10",
      "rationale": "waarom passend voor deze situatie",
      "pros": ["minstens 1 concreet voordeel voor deze situatie"],
      "cons": ["minstens 1 concreet nadeel/risico voor deze situatie"],
      "expectedOutput": ["welk type output deze toepassing oplevert, concreet en bruikbaar"]
    }
  ],
  "recommendedModelId": "string (beste keuze uit recommendations)",
  "recommendationReason": "waarom dit model nu de beste keuze is"
}

Regels:
- Geef 3 aanbevelingen.
- Kies uitsluitend modellen met een erkende theoretische basis uit de catalogus.
- Wees contextspecifiek voor dit bedrijf en vraagstuk.
- Benoem voor- en nadelen situationeel, niet generiek.
- expectedOutput moet beschrijven wat de gebruiker concreet uit het model krijgt.
- Alle tekst in het Nederlands.`;

    const userPrompt = `Bedrijf: ${organizationName}
Sector: ${sector}
Grootte: ${size}
Vraagstuk: ${challenge}
Projectdoelen: ${goals}
Aanvullende context: ${payload?.extraContext ?? ""}

Beschikbare modelcatalogus:
${buildCatalogForPrompt()}`;

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock && textBlock.type === "text" ? textBlock.text : "";
    const parsed = sanitizeAdvice(parseModelSelectionAdvice(raw));

    return NextResponse.json({ advice: parsed });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ongeldige invoer.", details: error.flatten() },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Onbekende fout";
    const status =
      message === "Niet ingelogd." ? 401 : message.includes("niet gevonden") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
