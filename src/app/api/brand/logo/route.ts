import { access, readFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_LOGO_SOURCE = path.join(process.cwd(), "public", "ai-group-logo.png");
const PROJECT_LOGO_SOURCE_SVG = path.join(process.cwd(), "public", "ai-group-logo.svg");

function fallbackSvg(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 180" role="img" aria-label="AI-Group.nl">
  <defs>
    <linearGradient id="b" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="#2D6DFF"/>
      <stop offset="100%" stop-color="#6B85D6"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="18" fill="#030B2D"/>
  <text x="48" y="88" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#FFFFFF">AI-Group.</text>
  <text x="380" y="88" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="url(#b)">nl</text>
  <text x="48" y="132" font-family="Arial, sans-serif" font-size="24" letter-spacing="3" fill="#6B85D6">AI-FIRST - WE SHIP FAST.</text>
</svg>`.trim();
}

export async function GET() {
  const customLogoPath = process.env.BRAND_LOGO_PATH?.trim();
  const candidates = [customLogoPath, PROJECT_LOGO_SOURCE, PROJECT_LOGO_SOURCE_SVG].filter(
    (value): value is string => Boolean(value),
  );
  try {
    let resolved = "";
    for (const candidate of candidates) {
      try {
        await access(candidate);
        resolved = candidate;
        break;
      } catch {
        // Try next candidate.
      }
    }
    if (!resolved) throw new Error("No logo file found");
    const bytes = await readFile(resolved);
    const contentType = resolved.endsWith(".svg") ? "image/svg+xml; charset=utf-8" : "image/png";
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response(fallbackSvg(), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
}
