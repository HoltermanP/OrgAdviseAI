import type { BrandStyle } from "@/db/schema";

export type PdfBrandTheme = {
  accentColor: string;
  secondaryColor: string;
  mutedColor: string;
  footerText: string;
  logoUrl: string | null;
};

export const DEFAULT_PDF_THEME: PdfBrandTheme = {
  accentColor: "#185FA5",
  secondaryColor: "#0F172A",
  mutedColor: "#64748B",
  footerText: "OrgAdvisor AI · AI-Group — Vertrouwelijk adviesdocument",
  logoUrl: null,
};

export function pdfThemeFromBrandStyle(row: BrandStyle | null | undefined): PdfBrandTheme {
  if (!row) return { ...DEFAULT_PDF_THEME };
  const footer =
    row.footerText?.trim() ||
    DEFAULT_PDF_THEME.footerText;
  return {
    accentColor: row.accentColor || DEFAULT_PDF_THEME.accentColor,
    secondaryColor: row.secondaryColor || DEFAULT_PDF_THEME.secondaryColor,
    mutedColor: row.mutedColor || DEFAULT_PDF_THEME.mutedColor,
    footerText: footer,
    logoUrl: row.logoUrl?.trim() || null,
  };
}
