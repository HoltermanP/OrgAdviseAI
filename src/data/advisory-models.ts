import { MODEL_CATEGORIES, type ModelCategory } from "./categories";

export type JsonSchemaProperty = {
  type: "string" | "number" | "boolean";
  title: string;
  description?: string;
  format?: "textarea";
};

export type ModelInputSchema = {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
};

export type AdvisoryModel = {
  id: string;
  name: string;
  category: ModelCategory;
  categoryLabel: string;
  description: string;
  whenToUse: string;
  systemPrompt: string;
  inputSchema: ModelInputSchema;
};

const JSON_OUTPUT_INSTRUCTION = `

Je antwoord is ALLEEN geldige JSON (geen markdown, geen code fences) met exact deze structuur.
Alle tekstvelden bevatten semantische HTML-fragmenten (geen volledig document): gebruik <p>, <br>, <ul>/<li>, <ol>/<li>, <h3>, <strong>, <em> waar het de leesbaarheid helpt. Geen <script> of <style>.
{
  "summary": "string (HTML)",
  "frameworkApplication": "string (HTML)",
  "keyFindings": ["string (HTML per punt)"],
  "recommendations": [{ "title": "string (HTML)", "description": "string (HTML)" }],
  "riskFlags": [{ "title": "string (platte tekst of korte HTML)", "severity": "low" | "medium" | "high", "detail": "string (HTML)" }],
  "implementationSteps": [{ "phase": "string (HTML)", "actions": ["string (HTML)"] }]
}`;

const BASE_FIELDS: ModelInputSchema = {
  type: "object",
  properties: {
    strategicContext: {
      type: "string",
      title: "Strategische context",
      description: "Korte beschrijving van positie, doelen en druk van buitenaf.",
      format: "textarea",
    },
    stakeholders: {
      type: "string",
      title: "Belangrijkste stakeholders",
      format: "textarea",
    },
    dataSignals: {
      type: "string",
      title: "Data & signalen",
      description: "KPI's, enquêtes, klantfeedback, operationele cijfers die relevant zijn.",
      format: "textarea",
    },
  },
  required: ["strategicContext", "dataSignals"],
};

function schemaVariant(
  extra: Record<string, JsonSchemaProperty>,
  required: string[],
): ModelInputSchema {
  return {
    type: "object",
    properties: { ...BASE_FIELDS.properties, ...extra },
    required: [...BASE_FIELDS.required, ...required],
  };
}

const MODEL_BLUEPRINTS: Record<
  ModelCategory,
  { slug: string; name: string; focus: string }[]
> = {
  strategy: [
    { slug: "portfolio-review", name: "Portfolio Review", focus: "Balans tussen business units en investeringskeuzes." },
    { slug: "scenario-planning", name: "Scenario Planning", focus: "Meerdere toekomstbeelden en implicaties." },
    { slug: "competitive-positioning", name: "Concurrentiepositie", focus: "Marktstructuur en onderscheidend vermogen." },
    { slug: "value-proposition-lab", name: "Waardepropositie Lab", focus: "Klantwaarde en propositie-consistentie." },
    { slug: "growth-pathways", name: "Groei-paden", focus: "Organische vs. anorganische groei." },
    { slug: "capability-heatmap", name: "Capability Heatmap", focus: "Strategische capabilities vs. ambities." },
    { slug: "strategic-risk-register", name: "Strategisch risicoregister", focus: "Top-risico's op strategisch niveau." },
    { slug: "okrs-alignment", name: "OKR-alignment", focus: "Doelen vertalen naar meetbare resultaten." },
    { slug: "market-entry-scan", name: "Marktentry-scan", focus: "Nieuwe markten of segmenten." },
    { slug: "ecosystem-mapping", name: "Ecosysteem mapping", focus: "Partners, platforms en afhankelijkheden." },
  ],
  organization: [
    { slug: "org-design-sprint", name: "Organisatieontwerp Sprint", focus: "Structuur, span of control, lagen." },
    { slug: "role-clarity", name: "Rolhelderheid", focus: "RACI, mandaten, besluitvorming." },
    { slug: "span-layers-audit", name: "Span & Lagen Audit", focus: "Managementdichtheid en escalaties." },
    { slug: "matrix-health", name: "Matrix Vitaliteit", focus: "Dotted lines en resource conflicts." },
    { slug: "shared-services-fit", name: "Shared Services Fit", focus: "Centralisatie vs. embedded teams." },
    { slug: "governance-blueprint", name: "Governance Blueprint", focus: "Boards, forums, beleidslijnen." },
    { slug: "delegation-maturity", name: "Delegatie-maturiteit", focus: "Autonomie en verantwoordelijkheid." },
    { slug: "team-topologies", name: "Team Topologies Scan", focus: "Stream-aligned, enabling, complicated-subsystem." },
    { slug: "coordination-cost", name: "Coördinatiekosten", focus: "Meeting load en handovers." },
    { slug: "org-culture-handshake", name: "Cultuur & Structuur", focus: "Fit tussen waarden en ontwerp." },
  ],
  processes: [
    { slug: "process-mining-lite", name: "Process Mining Lite", focus: "Doorlooptijden en bottlenecks." },
    { slug: "sipoc-rebuild", name: "SIPOC Rebuild", focus: "Leveranciers, inputs, proces, outputs, klanten." },
    { slug: "sla-hygiene", name: "SLA Hygiëne", focus: "Service levels en escalatie." },
    { slug: "handoff-redesign", name: "Handoff Redesign", focus: "Overdracht tussen teams." },
    { slug: "quality-loop", name: "Kwaliteitslus", focus: "Fouten, rework, preventie." },
    { slug: "lean-waste-scan", name: "Lean Waste Scan", focus: "8 wastes in administratieve ketens." },
    { slug: "customer-journey-ops", name: "Customer Journey Ops", focus: "Operationele touchpoints." },
    { slug: "control-framework", name: "Control Framework", focus: "Controls vs. agility." },
    { slug: "process-kpi-balance", name: "Proces-KPI Balans", focus: "Output vs. outcome metrics." },
    { slug: "automation-candidate", name: "Automatisering Kandidaten", focus: "RPA/AI geschiktheid." },
  ],
  change: [
    { slug: "change-readiness", name: "Change Readiness", focus: "Weerstand, capaciteit, sponsorlijn." },
    { slug: "stakeholder-heat", name: "Stakeholder Heat", focus: "Invloed en interesse." },
    { slug: "adkar-pulse", name: "ADKAR Pulse", focus: "Awareness t/m reinforcement." },
    { slug: "comms-plan", name: "Communicatieplan", focus: "Boodschappen, kanalen, cadans." },
    { slug: "training-impact", name: "Training Impact", focus: "Skills gap en enablement." },
    { slug: "sponsor-coalition", name: "Sponsor Coalitie", focus: "Macht en commitment." },
    { slug: "quick-wins-backlog", name: "Quick Wins Backlog", focus: "Momentum en vertrouwen." },
    { slug: "benefits-realization", name: "Benefits Realization", focus: "Business case en meting." },
    { slug: "cutover-risk", name: "Cutover Risico", focus: "Go-live en rollback." },
    { slug: "culture-of-change", name: "Cultuur van verandering", focus: "Leren en itereren." },
  ],
  culture: [
    { slug: "values-integrity", name: "Waarden-integriteit", focus: "Gedrag vs. geclaimde waarden." },
    { slug: "psychological-safety", name: "Psychological Safety", focus: "Spreekruimte en conflict." },
    { slug: "recognition-systems", name: "Erkenningssystemen", focus: "Belonen wat je wilt zien." },
    { slug: "rituals-audit", name: "Rituelen Audit", focus: "Ceremonies die cultuur versterken." },
    { slug: "subcultures-map", name: "Subculturen Map", focus: "Tribes binnen de organisatie." },
    { slug: "trust-index", name: "Trust Index", focus: "Vertrouwen tussen lagen." },
    { slug: "inclusion-barriers", name: "Inclusie Barrières", focus: "Toegang en vertegenwoordiging." },
    { slug: "feedback-maturity", name: "Feedback Maturiteit", focus: "360, 1:1, performance dialogen." },
    { slug: "purpose-alignment", name: "Purpose Alignment", focus: "Zingeving en dagelijkse realiteit." },
    { slug: "culture-metrics", name: "Cultuur Metrics", focus: "Meetbare cultuurindicatoren." },
  ],
  leadership: [
    { slug: "leadership-pipeline", name: "Leadership Pipeline", focus: "Opvolging en talent." },
    { slug: "exec-team-effectiveness", name: "MT Effectiviteit", focus: "Besluitvorming en conflict." },
    { slug: "coaching-culture", name: "Coaching Cultuur", focus: "Managers als coaches." },
    { slug: "decision-rights", name: "Decision Rights", focus: "RAPID / DACI toepassing." },
    { slug: "leadership-brand", name: "Leadership Brand", focus: "Signaal naar organisatie." },
    { slug: "situational-leadership", name: "Situational Leadership Fit", focus: "Stijl vs. volwassenheid team." },
    { slug: "exec-time-use", name: "Tijdsbesteding MT", focus: "Strategie vs. operatie." },
    { slug: "board-ceo-interface", name: "Board-CEO Interface", focus: "Verwachtingen en transparantie." },
    { slug: "middle-management-load", name: "Middenmanagement Load", focus: "Spanning tussen top en uitvoering." },
    { slug: "leadership-development-plan", name: "Leiderschapsontwikkeling", focus: "Programma's en leerpaden." },
  ],
  hr_talent: [
    { slug: "workforce-planning", name: "Workforce Planning", focus: "Vraag/aanbod vaardigheden." },
    { slug: "talent-review", name: "Talent Review", focus: "9-box en succession." },
    { slug: "comp-benefits-fit", name: "Comp & Benefits Fit", focus: "Marktconformiteit en eerlijkheid." },
    { slug: "performance-system", name: "Prestatiesysteem", focus: "Doelen, feedback, calibratie." },
    { slug: "learning-strategy", name: "Leerstrategie", focus: "Skills-based organisatie." },
    { slug: "employee-value-prop", name: "Employee Value Prop", focus: "Employer branding intern." },
    { slug: "hybrid-work-policy", name: "Hybrid Work Policy", focus: "Productiviteit en rechtvaardigheid." },
    { slug: "hr-operating-model", name: "HR Operating Model", focus: "BP, CoE, SSC balans." },
    { slug: "diversity-metrics", name: "Diversity Metrics", focus: "Representatie door funnel." },
    { slug: "wellbeing-risk", name: "Wellbeing Risico", focus: "Burnout signalen en interventies." },
  ],
  innovation: [
    { slug: "innovation-portfolio", name: "Innovatieportfolio", focus: "Horizon 1/2/3 balans." },
    { slug: "experimentation-engine", name: "Experimentatie Engine", focus: "Hypotheses en learnings." },
    { slug: "idea-to-scale", name: "Idee naar Schaal", focus: "Stage gates en funding." },
    { slug: "open-innovation", name: "Open Innovatie", focus: "Ecosystemen en partnerships." },
    { slug: "tech-scouting", name: "Tech Scouting", focus: "Emerging tech relevantie." },
    { slug: "innovation-metrics", name: "Innovatie KPI's", focus: "Leading vs. lagging." },
    { slug: "culture-for-innovation", name: "Cultuur voor Innovatie", focus: "Psychological safety + resources." },
    { slug: "customer-co-creation", name: "Customer Co-creation", focus: "Design research en pilots." },
    { slug: "ip-strategy-lite", name: "IP Strategy Lite", focus: "Bescherming vs. snelheid." },
    { slug: "innovation-governance", name: "Innovatie Governance", focus: "Budgetten en prioritering." },
  ],
  project: [
    { slug: "project-health", name: "Project Health", focus: "Scope, tijd, budget, kwaliteit." },
    { slug: "dependency-map", name: "Afhankelijkheden Map", focus: "Kritieke pad en interfaces." },
    { slug: "risk-register-proj", name: "Project Risicoregister", focus: "Top-risico's en mitigatie." },
    { slug: "benefits-tracking", name: "Benefits Tracking", focus: "Realisatie business case." },
    { slug: "agile-maturity", name: "Agile Maturiteit", focus: "Teams, events, artefacten." },
    { slug: "resource-capacity", name: "Resource Capaciteit", focus: "FTE, skills, conflicts." },
    { slug: "steerco-pack", name: "Steerco Pack", focus: "Besluitvorming en transparantie." },
    { slug: "vendor-performance", name: "Leveranciersperformance", focus: "SLA en samenwerking." },
    { slug: "uat-readiness", name: "UAT Readiness", focus: "Teststrategie en acceptatie." },
    { slug: "closure-lessons", name: "Afronding & Lessen", focus: "Retro en knowledge transfer." },
  ],
  finance: [
    { slug: "unit-economics", name: "Unit Economics", focus: "Marges en schaalvoordelen." },
    { slug: "cash-conversion", name: "Cash Conversie", focus: "Working capital." },
    { slug: "cost-structure", name: "Kostenstructuur", focus: "Fix vs. variabel." },
    { slug: "pricing-power", name: "Pricing Power", focus: "Prijselasticiteit en positionering." },
    { slug: "investment-prioritization", name: "Investeringsprioriteit", focus: "CapEx/OpEx trade-offs." },
    { slug: "financial-controls", name: "Financial Controls", focus: "Segregation of duties, reconciliaties." },
    { slug: "forecast-accuracy", name: "Forecast Nauwkeurigheid", focus: "Bias en variantie." },
    { slug: "profitability-by-segment", name: "Winstgevendheid per segment", focus: "Cross-subsidies." },
    { slug: "risk-financial", name: "Financieel Risico", focus: "FX, rente, liquiditeit." },
    { slug: "value-based-management", name: "Value Based Management", focus: "EVA-alternatieven en sturing." },
  ],
};

function buildPrompt(
  categoryLabel: string,
  name: string,
  focus: string,
): string {
  return (
    `Je bent een senior organisatieadviseur gespecialiseerd in ${categoryLabel}. ` +
    `Je voert het analysemodel "${name}" uit. Focus: ${focus}. ` +
    `Gebruik het kader concreet op de aangeleverde input; wees kritisch, praktisch en Europees-Nederlands in toon.` +
    JSON_OUTPUT_INSTRUCTION
  );
}

function buildModels(): AdvisoryModel[] {
  const out: AdvisoryModel[] = [];
  for (const cat of MODEL_CATEGORIES) {
    const blueprints = MODEL_BLUEPRINTS[cat.key];
    for (const bp of blueprints) {
      const id = `${cat.key}-${bp.slug}`;
      const extra: Record<string, JsonSchemaProperty> = {
        specificQuestion: {
          type: "string",
          title: `Specifieke vraag voor ${bp.name}`,
          format: "textarea",
        },
      };
      out.push({
        id,
        name: bp.name,
        category: cat.key,
        categoryLabel: cat.label,
        description: `${bp.name} helpt bij ${bp.focus.toLowerCase()} binnen ${cat.label.toLowerCase()}.`,
        whenToUse: `Gebruik dit model wanneer je ${bp.focus.toLowerCase()} wilt onderzoeken en vertalen naar concrete adviezen.`,
        systemPrompt: buildPrompt(cat.label, bp.name, bp.focus),
        inputSchema: schemaVariant(extra, ["specificQuestion"]),
      });
    }
  }
  return out;
}

export const ADVISORY_MODELS: AdvisoryModel[] = buildModels();

export const ADVISORY_MODEL_BY_ID: Record<string, AdvisoryModel> =
  Object.fromEntries(ADVISORY_MODELS.map((m) => [m.id, m]));
