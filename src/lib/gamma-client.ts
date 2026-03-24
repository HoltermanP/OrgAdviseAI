const GAMMA_API_BASE = "https://public-api.gamma.app/v1.0";

export type GammaGenerationStatus = {
  generationId: string;
  status: string;
  gammaUrl?: string;
  exportUrl?: string;
  credits?: { deducted?: number; remaining?: number };
};

export type CreateGammaPresentationParams = {
  inputText: string;
  /** Secties met \n---\n → preserve + inputTextBreaks; anders condense + auto */
  usedSectionBreaks: boolean;
  organizationName: string;
  reportTitle: string;
};

function getApiKey(): string {
  const key = process.env.GAMMA_API_KEY?.trim();
  if (!key) {
    throw new Error("GAMMA_API_KEY ontbreekt.");
  }
  return key;
}

export async function createGammaPresentation(
  params: CreateGammaPresentationParams,
): Promise<{ generationId: string }> {
  const key = getApiKey();
  const { inputText, usedSectionBreaks, organizationName, reportTitle } =
    params;

  const additionalInstructions = [
    `Organisatie: ${organizationName}.`,
    `Bron: adviesrapport "${reportTitle}".`,
    "Houd de inhoud zakelijk en in het Nederlands.",
    "Gebruik duidelijke titels per slide; geen fictieve cijfers toevoegen.",
  ].join(" ");

  const body: Record<string, unknown> = {
    inputText,
    format: "presentation",
    additionalInstructions,
    textOptions: {
      language: "nl",
      ...(usedSectionBreaks
        ? {}
        : {
            amount: "medium" as const,
            tone: "professioneel, helder",
            audience: "bestuur, directie en beleidsmedewerkers",
          }),
    },
    cardOptions: {
      dimensions: "16x9",
    },
    imageOptions: {
      source: "webFreeToUseCommercially",
    },
  };

  if (usedSectionBreaks) {
    body.textMode = "preserve";
    body.cardSplit = "inputTextBreaks";
    body.numCards = 24;
  } else {
    body.textMode = "condense";
    body.cardSplit = "auto";
    body.numCards = 12;
  }

  const res = await fetch(`${GAMMA_API_BASE}/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": key,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Gamma API (${res.status}): ${errText.slice(0, 500) || res.statusText}`,
    );
  }

  const data = (await res.json()) as { generationId?: string };
  if (!data.generationId) {
    throw new Error("Gamma gaf geen generationId terug.");
  }
  return { generationId: data.generationId };
}

export async function getGammaGeneration(
  generationId: string,
): Promise<GammaGenerationStatus> {
  const key = getApiKey();
  const res = await fetch(
    `${GAMMA_API_BASE}/generations/${encodeURIComponent(generationId)}`,
    {
      headers: { "X-API-KEY": key },
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Gamma API (${res.status}): ${errText.slice(0, 500) || res.statusText}`,
    );
  }

  return (await res.json()) as GammaGenerationStatus;
}
