import { normalizeDocumentHtml } from "@/lib/content-format";

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Ruwe HTML naar leesbare platte tekst (één blok). */
export function stripHtmlToPlainText(html: string): string {
  let s = html
    .replace(/<\/(h[1-6]|p|div|section|article|li|ul|ol|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<[^>]+>/g, "");
  s = decodeBasicEntities(s);
  return s.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Rapport-HTML naar Gamma `inputText` met `\n---\n` tussen secties
 * (voor `cardSplit: "inputTextBreaks"` + `textMode: "preserve"`).
 */
export function reportHtmlToGammaInputText(html: string): {
  text: string;
  usedSectionBreaks: boolean;
} {
  const normalized = normalizeDocumentHtml(html.trim());
  if (!normalized.trim()) {
    return { text: "", usedSectionBreaks: false };
  }

  const sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  const chunks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(normalized)) !== null) {
    const plain = stripHtmlToPlainText(m[1]);
    if (plain) chunks.push(plain);
  }

  if (chunks.length >= 2) {
    return {
      text: chunks.join("\n\n---\n\n"),
      usedSectionBreaks: true,
    };
  }

  return {
    text: stripHtmlToPlainText(normalized),
    usedSectionBreaks: false,
  };
}
