# OrgAdvisor AI

Next.js-app voor organisatieadvies: 100 adviesmodellen, analyses via Claude Opus (`claude-opus-4-5`), rapporten met streaming en PDF-export, en project-chat met volledige analyse-context.

## Vereisten

- Node.js 20+
- PostgreSQL-database
- [Clerk](https://clerk.com)-account
- [Anthropic](https://console.anthropic.com)-API-sleutel

## Lokale setup

1. Kopieer omgevingsvariabelen:

   ```bash
   cp .env.example .env.local
   ```

   Vul `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL` en `ANTHROPIC_API_KEY`.

2. Installeer dependencies:

   ```bash
   npm install
   ```

3. Genereer en push het databaseschema (Drizzle):

   ```bash
   npm run db:generate
   npm run db:push
   ```

   `db:push` past het schema direct toe op de database uit `DATABASE_URL` (geschikt voor development en Vercel/Neon).

4. Start de ontwikkelserver:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000), meld je aan; bij de eerste login wordt je Clerk-gebruiker gesynchroniseerd via `POST /api/users/sync`.

## Scripts

| Script        | Beschrijving              |
| ------------- | ------------------------- |
| `npm run dev` | Ontwikkelserver           |
| `npm run build` | Productiebuild        |
| `npm run start` | Productieserver         |
| `npm run lint`  | ESLint                  |
| `npm run db:generate` | Drizzle migrations genereren |
| `npm run db:push`     | Schema naar DB pushen   |

## Deploy op Vercel

1. Koppel de GitHub-repo (of deploy via CLI).
2. Zet dezelfde omgevingsvariabelen in Vercel Project Settings.
3. Zorg dat `DATABASE_URL` naar je productie-Postgres wijst en voer één keer `npm run db:push` uit (lokaal tegen productie-URL of via CI), of gebruik je eigen migratieproces.

## Structuur (hoog niveau)

- `src/app/api/*` — REST API (projecten, analyses, rapporten, chat, user sync).
- `src/db/schema.ts` — Drizzle-schema (`users`, `projects`, `analyses`, `reports`).
- `src/data/advisory-models.ts` — 100 modellen in 10 categorieën.
- `src/components` — Layout, modellenkaarten, analyse-resultaat, rapportviewer (inclusief PDF), chat.

## Merk en huisstijl

- Kernmerk: `AI-Group.nl`
- Tagline: `AI-first - we ship fast.`
- Standaard logo-endpoint: `/api/brand/logo`
- Documenten (rapporten/PDF) gebruiken standaard dezelfde kleuren + footer via `DEFAULT_PDF_THEME`.
- Presentaties (Gamma) krijgen dezelfde huisstijl via extra instructies in de Gamma-generator.

Zie ook `docs/huisstijl.md` voor richtlijnen.
