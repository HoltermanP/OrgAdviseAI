import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { PdfBrandTheme } from "@/lib/brand-theme";
import { DEFAULT_PDF_THEME } from "@/lib/brand-theme";
import type { PdfContentBlock, ReportPdfRichSection } from "@/lib/html-to-pdf-blocks";

const baseLayout = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1E293B",
  },
  coverTitle: {
    fontSize: 28,
    marginBottom: 12,
    fontFamily: "Helvetica-Bold",
  },
  coverSub: {
    fontSize: 14,
    marginBottom: 24,
    fontFamily: "Helvetica-Bold",
  },
  coverMeta: {
    fontSize: 11,
  },
  h1: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  h3: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  p: {
    marginBottom: 6,
    lineHeight: 1.5,
  },
  bullet: {
    marginBottom: 4,
    lineHeight: 1.45,
    paddingLeft: 12,
  },
  tocItem: {
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 9,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 16,
    objectFit: "contain",
  },
});

type ReportPdfDocumentProps = {
  organizationName: string;
  reportTypeLabel: string;
  generatedAt: string;
  sections: ReportPdfRichSection[];
  theme?: PdfBrandTheme;
};

function SectionBody({
  blocks,
  theme,
}: {
  blocks: PdfContentBlock[];
  theme: PdfBrandTheme;
}) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === "h3") {
          return (
            <Text
              key={i}
              style={[baseLayout.h3, { color: theme.secondaryColor }]}
            >
              {b.text}
            </Text>
          );
        }
        if (b.type === "bullet") {
          return (
            <Text key={i} style={baseLayout.bullet}>
              • {b.text}
            </Text>
          );
        }
        return (
          <Text key={i} style={baseLayout.p}>
            {b.text}
          </Text>
        );
      })}
    </>
  );
}

export function ReportPdfDocument({
  organizationName,
  reportTypeLabel,
  generatedAt,
  sections,
  theme: themeProp,
}: ReportPdfDocumentProps) {
  const theme = themeProp ?? DEFAULT_PDF_THEME;
  const footerBorder = theme.mutedColor;
  const footerTextColor = theme.mutedColor;

  return (
    <Document>
      <Page size="A4" style={baseLayout.page}>
        <View>
          {theme.logoUrl ? (
            <Image src={theme.logoUrl} style={baseLayout.logo} />
          ) : null}
          <Text style={[baseLayout.coverTitle, { color: theme.secondaryColor }]}>
            {organizationName}
          </Text>
          <Text style={[baseLayout.coverSub, { color: theme.accentColor }]}>
            {reportTypeLabel}
          </Text>
          <Text style={[baseLayout.coverMeta, { color: theme.mutedColor }]}>
            Gegenereerd: {generatedAt}
          </Text>
          <Text style={[baseLayout.h1, { color: theme.secondaryColor }]}>
            Inhoudsopgave
          </Text>
          {sections.map((s, i) => (
            <Text
              key={i}
              style={[baseLayout.tocItem, { color: theme.accentColor }]}
            >
              {i + 1}. {s.title}
            </Text>
          ))}
        </View>
        <Text
          style={[
            baseLayout.footer,
            {
              color: footerTextColor,
              borderTopColor: footerBorder,
            },
          ]}
          fixed
        >
          {theme.footerText}
        </Text>
      </Page>
      {sections.map((section, idx) => (
        <Page key={idx} size="A4" style={baseLayout.page}>
          <View>
            <Text style={[baseLayout.h1, { color: theme.secondaryColor }]}>
              {section.title}
            </Text>
            <SectionBody blocks={section.blocks} theme={theme} />
          </View>
          <Text
            style={[
              baseLayout.footer,
              {
                color: footerTextColor,
                borderTopColor: footerBorder,
              },
            ]}
            fixed
          >
            {theme.footerText} — {organizationName}
          </Text>
        </Page>
      ))}
    </Document>
  );
}
