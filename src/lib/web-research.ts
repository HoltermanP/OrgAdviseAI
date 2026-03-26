const USER_AGENT =
  "Mozilla/5.0 (compatible; OrgAdvisorAI/1.0; +https://orgadvisor.local)";

export type ResearchSource = {
  title: string;
  url: string;
  sourceType: "web_specific" | "web_sector";
  excerpt: string;
};

type SearchHit = {
  title: string;
  url: string;
  snippet: string;
};

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value: string): string {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUrl(url: string): string {
  try {
    return new URL(url).toString();
  } catch {
    return "";
  }
}

function pickExcerpt(markdownLikeText: string, maxLength = 320): string {
  const lines = markdownLikeText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 40 && !line.startsWith("http"));
  const text = lines.slice(0, 5).join(" ");
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

async function runDuckDuckGoSearch(query: string, limit: number): Promise<SearchHit[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html",
    },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const hits: SearchHit[] = [];
  const regex =
    /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null = regex.exec(html);
  while (match && hits.length < limit) {
    const rawUrl = decodeURIComponent(match[1]);
    const title = stripHtml(match[2]);
    const snippet = stripHtml(match[3]);
    const urlMatch = rawUrl.match(/[?&]uddg=([^&]+)/);
    const directUrl = normalizeUrl(urlMatch ? decodeURIComponent(urlMatch[1]) : rawUrl);
    if (directUrl) {
      hits.push({ title, url: directUrl, snippet });
    }
    match = regex.exec(html);
  }
  return hits;
}

async function fetchReadablePage(url: string): Promise<string> {
  const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;
  const res = await fetch(proxyUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/plain",
    },
  });
  if (!res.ok) return "";
  return res.text();
}

async function enrichHits(
  hits: SearchHit[],
  sourceType: "web_specific" | "web_sector",
): Promise<ResearchSource[]> {
  const selected = hits.slice(0, 3);
  const enriched = await Promise.all(
    selected.map(async (hit) => {
      const pageText = await fetchReadablePage(hit.url);
      return {
        title: hit.title || hit.url,
        url: hit.url,
        sourceType,
        excerpt: pickExcerpt(pageText) || hit.snippet,
      } satisfies ResearchSource;
    }),
  );
  return enriched.filter((item) => item.excerpt.length > 0);
}

export async function gatherResearchSources(input: {
  organizationName: string;
  sector: string;
  challenge: string;
  modelName: string;
}): Promise<ResearchSource[]> {
  const specificQuery = `${input.organizationName} ${input.challenge} ${input.modelName}`;
  const sectorQuery = `${input.sector} trends best practices ${new Date().getFullYear()}`;

  const [specificHits, sectorHits] = await Promise.all([
    runDuckDuckGoSearch(specificQuery, 5),
    runDuckDuckGoSearch(sectorQuery, 5),
  ]);

  const [specificSources, sectorSources] = await Promise.all([
    enrichHits(specificHits, "web_specific"),
    enrichHits(sectorHits, "web_sector"),
  ]);

  const deduped = new Map<string, ResearchSource>();
  for (const source of [...specificSources, ...sectorSources]) {
    if (!deduped.has(source.url)) {
      deduped.set(source.url, source);
    }
  }
  return Array.from(deduped.values()).slice(0, 8);
}

/**
 * Haalt tekstfragmenten op voor door de gebruiker goedgekeurde organisatie-URL's
 * (zelfde lees-proxy als andere webresearch).
 */
export async function sourcesFromApprovedUrls(urls: string[]): Promise<ResearchSource[]> {
  const normalized = [
    ...new Set(urls.map((u) => normalizeUrl(u.trim())).filter((u) => u.length > 0)),
  ].slice(0, 12);

  const enriched = await Promise.all(
    normalized.map(async (url) => {
      try {
        const pageText = await fetchReadablePage(url);
        const excerpt = pickExcerpt(pageText);
        if (!excerpt) return null;
        const host = new URL(url).hostname;
        return {
          title: `Goedgekeurde organisatiebron (${host})`,
          url,
          sourceType: "web_specific" as const,
          excerpt,
        } satisfies ResearchSource;
      } catch {
        return null;
      }
    }),
  );

  const filtered: ResearchSource[] = [];
  for (const item of enriched) {
    if (item) filtered.push(item);
  }
  return filtered;
}

export function mergeResearchSourcesByUrl(
  ...batches: ResearchSource[][]
): ResearchSource[] {
  const map = new Map<string, ResearchSource>();
  for (const batch of batches) {
    for (const s of batch) {
      if (!map.has(s.url)) map.set(s.url, s);
    }
  }
  return Array.from(map.values());
}
