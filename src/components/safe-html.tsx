"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const SANITIZE = {
  ADD_ATTR: ["target", "rel"],
  ALLOWED_TAGS: [
    "a",
    "article",
    "b",
    "blockquote",
    "br",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "li",
    "ol",
    "p",
    "pre",
    "section",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "ul",
  ],
  ALLOWED_ATTR: ["href", "class", "id", "colspan", "rowspan", "target", "rel"],
};

type SafeHtmlProps = {
  html: string;
  className?: string;
};

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html || "", SANITIZE),
    [html],
  );

  return (
    <div
      className={cn(
        "max-w-none space-y-4 text-[var(--gray-dark)]",
        "[&_a]:text-[var(--blue)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--gray-light)] [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_code]:rounded [&_code]:bg-[var(--gray-light)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm",
        "[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-[var(--navy)]",
        "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--navy)] [&_h2]:first:mt-0",
        "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--navy)]",
        "[&_h4]:mb-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-[var(--navy)]",
        "[&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_p]:leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-sm [&_pre]:text-slate-100",
        "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-[var(--gray-light)] [&_td]:px-2 [&_td]:py-1",
        "[&_th]:border [&_th]:border-[var(--gray-light)] [&_th]:bg-[var(--gray-light)]/40 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
        className,
      )}
      // eslint-disable-next-line react/no-danger -- bewust gesanitized met DOMPurify
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
