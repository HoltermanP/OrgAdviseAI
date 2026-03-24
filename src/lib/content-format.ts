import { marked } from "marked";

export function looksLikeHtml(raw: string): boolean {
  const t = raw.trim();
  if (!t.startsWith("<")) return false;
  return /<\/[a-z][\s\S]*>/i.test(t) || /<[a-z][^>]*\/>/i.test(t);
}

export function normalizeDocumentHtml(raw: string): string {
  const t = raw.trim();
  if (!t) return "<p></p>";
  if (looksLikeHtml(t)) return t;
  marked.setOptions({ gfm: true, breaks: true });
  const out = marked.parse(t) as string;
  return out.trim() ? out : `<p>${escapeHtmlPlain(t)}</p>`;
}

function escapeHtmlPlain(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

