# Huisstijl AI-Group.nl

Deze app gebruikt een centrale huisstijl die past bij het AI-Group.nl-logo.

## Visuele basis

- Primair donkerblauw: `#030B2D`
- Accentblauw: `#2D6DFF`
- Gedempte accentkleur: `#6B85D6`
- Lichte achtergrond: `#F6F8FF`
- Merkregel: `AI-first - we ship fast.`

## Gebruik in de app

- Logo en merknaam via centrale component: `src/components/brand/brand-logo.tsx`
- Centrale merkwaarden: `src/lib/brand.ts`
- Fallback/logo endpoint: `src/app/api/brand/logo/route.ts`

## Gebruik in documenten

- PDF/rapport styling via `src/lib/brand-theme.ts`
- Default footertekst: AI-Group.nl + tagline + vertrouwelijkheidsregel
- Rapportgeneratieprompt vraagt expliciet om AI-Group.nl-merkregel in de output

## Gebruik in presentaties

- Gamma-aansturing bevat instructies voor:
  - donkerblauwe basis en helderblauwe accenten
  - branding op titel- en slotslide
  - professionele, bondige adviesstijl

## Praktisch

- Productie-default: `public/ai-group-logo.svg` (zonder extra configuratie).
- Voor een ander logo: zet `BRAND_LOGO_PATH` in de omgeving naar een bestandspad.
- Zonder geldig logo valt de app terug op een inline SVG-logo in AI-Group.nl-stijl.
