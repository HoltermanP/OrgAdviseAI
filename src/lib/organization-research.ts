const USER_AGENT =
  "Mozilla/5.0 (compatible; OrgAdvisorAI/1.0; +https://orgadvisor.local)";

export type OrganizationSourceSuggestion = {
  url: string;
  title: string;
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
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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

export async function suggestOrganizationSources(input: {
  organizationName: string;
  sector?: string;
}): Promise<OrganizationSourceSuggestion[]> {
  const query = `${input.organizationName} official website ${
    input.sector ?? ""
  } company profile`;
  const hits = await runDuckDuckGoSearch(query, 8);

  const top = hits.slice(0, 6);
  const enriched = await Promise.all(
    top.map(async (hit) => {
      const text = await fetchReadablePage(hit.url);
      return {
        url: hit.url,
        title: hit.title || hit.url,
        excerpt: pickExcerpt(text) || hit.snippet,
      };
    }),
  );

  const deduped = new Map<string, OrganizationSourceSuggestion>();
  for (const item of enriched) {
    if (!item.url || deduped.has(item.url)) continue;
    if (!item.excerpt) continue;
    deduped.set(item.url, item);
  }
  return Array.from(deduped.values()).slice(0, 6);
}
