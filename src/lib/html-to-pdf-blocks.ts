import {
  parse,
  type HTMLElement,
  type Node as HtmlNode,
  type TextNode,
} from "node-html-parser";
import { looksLikeHtml, normalizeDocumentHtml } from "@/lib/content-format";

export type PdfContentBlock =
  | { type: "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string };

export type ReportPdfRichSection = {
  title: string;
  blocks: PdfContentBlock[];
};

function isTextNode(n: HtmlNode): n is TextNode {
  return n.nodeType === 3;
}

function isElement(n: HtmlNode): n is HTMLElement {
  return n.nodeType === 1;
}

function pushTextBlocks(target: PdfContentBlock[], text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t) target.push({ type: "paragraph", text: t });
}

function innerHtmlToBlocks(inner: string): PdfContentBlock[] {
  const frag = parse(`<div id="__pdf_root">${inner}</div>`);
  const div = frag.getElementById("__pdf_root");
  if (!div) {
    return [{ type: "paragraph", text: stripTags(inner) }];
  }

  const blocks: PdfContentBlock[] = [];

  function walk(nodes: HtmlNode[]) {
    for (const node of nodes) {
      if (isTextNode(node)) {
        pushTextBlocks(blocks, node.text);
        continue;
      }
      if (!isElement(node)) continue;
      const tag = node.tagName.toLowerCase();
      if (tag === "h3" || tag === "h4") {
        const t = node.text.trim();
        if (t) blocks.push({ type: "h3", text: t });
        continue;
      }
      if (tag === "p") {
        const t = node.text.trim();
        if (t) blocks.push({ type: "paragraph", text: t });
        continue;
      }
      if (tag === "ul" || tag === "ol") {
        for (const li of node.querySelectorAll(":scope > li")) {
          const lt = li.text.trim();
          if (lt) blocks.push({ type: "bullet", text: lt });
        }
        continue;
      }
      if (tag === "br") {
        continue;
      }
      if (tag === "div" || tag === "section" || tag === "article") {
        walk(node.childNodes);
        continue;
      }
      const t = node.text.trim();
      if (t) blocks.push({ type: "paragraph", text: t });
    }
  }

  walk(div.childNodes);

  if (blocks.length === 0) {
    return [{ type: "paragraph", text: stripTags(inner) }];
  }
  return blocks;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractSections(html: string): { title: string; innerHtml: string }[] {
  const normalized = normalizeDocumentHtml(html);
  const root = parse(
    normalized.startsWith("<") ? normalized : `<div>${normalized}</div>`,
  );
  const article = root.querySelector("article");
  const container = article ?? root;

  const directSections = container.querySelectorAll(":scope > section");
  if (directSections.length > 0) {
    return directSections.map((sec, i) => {
      const h2 = sec.querySelector("h2");
      const title = h2?.text.trim() || `Sectie ${i + 1}`;
      const clone = sec.clone() as HTMLElement;
      clone.querySelector("h2")?.remove();
      return { title, innerHtml: clone.innerHTML.trim() };
    });
  }

  const h2s = container.querySelectorAll("h2");
  if (h2s.length > 0) {
    return h2s.map((h2, i) => {
      const title = h2.text.trim() || `Sectie ${i + 1}`;
      const parts: string[] = [];
      let n: HtmlNode | null = h2.nextSibling;
      while (n) {
        if (isElement(n) && n.tagName === "H2") break;
        if (isElement(n)) parts.push(n.outerHTML);
        else if (isTextNode(n) && n.text.trim()) parts.push(n.text);
        n = "nextSibling" in n ? n.nextSibling : null;
      }
      return { title, innerHtml: parts.join("").trim() };
    });
  }

  return [{ title: "Rapport", innerHtml: container.innerHTML.trim() }];
}

/** Oude markdown-rapporten: ##-secties (zelfde logica als eerdere viewer-split). */
function sectionsFromMarkdownStyle(raw: string): { title: string; innerHtml: string }[] {
  if (!raw.trim().startsWith("## ")) {
    return [{ title: "Rapport", innerHtml: normalizeDocumentHtml(raw) }];
  }
  const blocks = raw
    .split(/^## /m)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map((block) => {
    const firstLineEnd = block.indexOf("\n");
    const title =
      firstLineEnd === -1 ? block : block.slice(0, firstLineEnd).trim();
    const body =
      firstLineEnd === -1 ? "" : block.slice(firstLineEnd + 1).trim();
    return {
      title,
      innerHtml: normalizeDocumentHtml(body || block),
    };
  });
}

export function contentToPdfSections(raw: string): ReportPdfRichSection[] {
  const t = raw.trim();
  if (!t) {
    return [{ title: "Rapport", blocks: [{ type: "paragraph", text: "" }] }];
  }

  let sectionSources: { title: string; innerHtml: string }[];

  if (looksLikeHtml(t)) {
    sectionSources = extractSections(t);
  } else if (t.includes("## ")) {
    sectionSources = sectionsFromMarkdownStyle(t);
  } else {
    sectionSources = extractSections(normalizeDocumentHtml(t));
  }

  return sectionSources.map(({ title, innerHtml }) => ({
    title,
    blocks: innerHtmlToBlocks(innerHtml),
  }));
}
