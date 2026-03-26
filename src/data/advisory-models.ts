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
  imageUrl: string;
  systemPrompt: string;
  inputSchema: ModelInputSchema;
};

const EXTERNAL_MODEL_IMAGE_URLS: string[] = [
  "https://managementmodellensite.nl/webcontent/uploads/Dienend-leiderschap-op-managementmodellensite.nl_-100x150_c.png",
  "https://managementmodellensite.nl/webcontent/uploads/Process-Communication-Model-op-managementmodellensite.nl_-100x150_c.png",
  "https://managementmodellensite.nl/webcontent/uploads/Model-Evidence-Based-Management-op-managementmodellensite.nl_-100x150_c.jpg",
  "https://managementmodellensite.nl/webcontent/uploads/357.-Inferentieladder-op-managementmodellensite.nl_-100x150_c.png",
  "https://managementmodellensite.nl/webcontent/uploads/Effectief-salesdeck-op-managementmodellensite.nl_-100x150_c.png",
  "https://managementmodellensite.nl/webcontent/uploads/Model-psychologische-veiligheid-en-prestatienormen-op-managementmodellensite.nl_-100x150_c.png",
  "https://managementmodellensite.nl/webcontent/uploads/Ziekteverzuim-op-managementmodellensite.nl_-100x150_c.png",
  "https://managementmodellensite.nl/webcontent/uploads/Organisatieprobleem-in-breder-perspectief-op-managementmodellensite.nl_-100x150_c.png",
  "https://managementmodellensite.nl/webcontent/uploads/Model-mandaat-en-verantwoordelijkheid-op-managementmodellensite.nl_-100x150_c.png",
  "https://managementmodellensite.nl/webcontent/uploads/298-1-Procesbeschrijving-100x150_c.png",
];

const JSON_OUTPUT_INSTRUCTION = `

Je antwoord is ALLEEN geldige JSON (geen markdown, geen code fences) met exact deze structuur.
Alle tekstvelden bevatten semantische HTML-fragmenten (geen volledig document): gebruik <p>, <br>, <ul>/<li>, <ol>/<li>, <h3>, <strong>, <em> waar het de leesbaarheid helpt. Geen <script> of <style>.
{
  "summary": "string (HTML)",
  "frameworkApplication": "string (HTML)",
  "keyFindings": ["string (HTML per punt)"],
  "recommendations": [{ "title": "string (HTML)", "description": "string (HTML)" }],
  "riskFlags": [{ "title": "string (platte tekst of korte HTML)", "severity": "low" | "medium" | "high", "detail": "string (HTML)" }],
  "implementationSteps": [{ "phase": "string (HTML)", "actions": ["string (HTML)"] }],
  "factualityLevel": "strict | balanced | exploratory",
  "assumptionsUsed": ["string (HTML per aanname, leeg bij strict)"],
  "scenarioVariants": [{ "name": "string (HTML)", "description": "string (HTML)" }],
  "sources": [{ "title": "string", "url": "string", "sourceType": "user_input | web_specific | web_sector", "excerpt": "string (kort citaat/samenvatting)" }]
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
    objectives: {
      type: "string",
      title: "Doel van de analyse",
      description: "Welke beslissingen moeten met deze analyse genomen worden?",
      format: "textarea",
    },
    constraints: {
      type: "string",
      title: "Randvoorwaarden",
      description: "Budget, capaciteit, tijd, compliance, governance of andere beperkingen.",
      format: "textarea",
    },
    knownRisks: {
      type: "string",
      title: "Bekende risico's",
      description: "Risico's of blokkades die nu al bekend zijn.",
      format: "textarea",
    },
    initiativesInFlight: {
      type: "string",
      title: "Lopende initiatieven",
      description: "Programma's of projecten die met dit onderwerp samenhangen.",
      format: "textarea",
    },
    assumptionsByUser: {
      type: "string",
      title: "Eigen aannames of hypotheses",
      description: "Welke aannames wil je expliciet laten toetsen?",
      format: "textarea",
    },
    desiredTimeHorizon: {
      type: "string",
      title: "Gewenste tijdshorizon",
      description: "Bijv. 0-3 maanden, 3-12 maanden, >12 maanden.",
    },
  },
  required: [],
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

function toSentenceCase(value: string): string {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function getCategoryLens(category: ModelCategory): string {
  switch (category) {
    case "strategy":
      return "strategische keuzes en positionering";
    case "organization":
      return "organisatiestructuur, governance en rolverdeling";
    case "processes":
      return "procesflow, bottlenecks en kwaliteitsborging";
    case "change":
      return "adoptie, weerstand en implementatiedynamiek";
    case "culture":
      return "gedrag, normen en samenwerking";
    case "leadership":
      return "leiderschapsgedrag en besluitvorming";
    case "hr_talent":
      return "talent, vaardigheden en personeelsdynamiek";
    case "innovation":
      return "experimentatie, schaalbaarheid en innovatiegovernance";
    case "project":
      return "levering, afhankelijkheden en projectbeheersing";
    case "finance":
      return "financiele sturing, risico en waardecreatie";
    default:
      return "de context van dit model";
  }
}

function buildModelSpecificFields(
  category: ModelCategory,
  modelName: string,
  focus: string,
): Record<string, JsonSchemaProperty> {
  const lens = getCategoryLens(category);
  const focusSentence = toSentenceCase(focus);
  return {
    specificQuestion: {
      type: "string",
      title: `Kernvraag voor ${modelName}`,
      description: `Welke beslissing of richting wil je met ${modelName} expliciet onderbouwen?`,
      format: "textarea",
    },
    scopeBoundary: {
      type: "string",
      title: `Scope & afbakening (${modelName})`,
      description: `${focusSentence} - wat valt binnen scope en wat expliciet niet?`,
      format: "textarea",
    },
    successSignals: {
      type: "string",
      title: "Gewenste uitkomstsignalen",
      description: `Welke indicatoren tonen aan dat vooruitgang zichtbaar wordt binnen ${lens}?`,
      format: "textarea",
    },
    decisionWindow: {
      type: "string",
      title: "Beslismoment en urgentie",
      description: "Wanneer moet een besluit vallen, en welke impact heeft vertraging?",
      format: "textarea",
    },
  };
}

const MODEL_BLUEPRINTS: Record<
  ModelCategory,
  { slug: string; name: string; focus: string }[]
> = {
  strategy: [
    { slug: "swot", name: "SWOT-analyse", focus: "Interne sterktes/zwaktes koppelen aan externe kansen/bedreigingen." },
    { slug: "pestel", name: "PESTEL-analyse", focus: "Macro-omgevingsfactoren systematisch in kaart brengen." },
    { slug: "porters-five-forces", name: "Porter's Five Forces", focus: "Concurrentiedruk en aantrekkelijkheid van de markt beoordelen." },
    { slug: "ansoff-matrix", name: "Ansoff Matrix", focus: "Groeistrategie kiezen via markt- en productopties." },
    { slug: "bcg-matrix", name: "BCG Matrix", focus: "Portfolio-keuzes maken op basis van marktaandeel en markgroei." },
    { slug: "vrio", name: "VRIO-framework", focus: "Strategische resources toetsen op duurzaam concurrentievoordeel." },
    { slug: "value-chain", name: "Porter's Value Chain", focus: "Waardecreatie en kostendrivers over primaire en ondersteunende activiteiten analyseren." },
    { slug: "blue-ocean", name: "Blue Ocean Strategy", focus: "Nieuwe marktruimte identificeren voorbij directe concurrentie." },
    { slug: "balanced-scorecard", name: "Balanced Scorecard", focus: "Strategie vertalen naar samenhangende prestatie-indicatoren." },
    { slug: "scenario-planning", name: "Scenario Planning", focus: "Strategische keuzes testen tegen meerdere toekomstscenario's." },
  ],
  organization: [
    { slug: "mckinsey-7s", name: "McKinsey 7S-model", focus: "Afstemming tussen strategie, structuur, systemen en soft factors toetsen." },
    { slug: "galbraith-star", name: "Galbraith Star Model", focus: "Organisatieontwerp analyseren via strategie, structuur, processen, beloning en mensen." },
    { slug: "mintzberg-configurations", name: "Mintzberg Organisatieconfiguraties", focus: "Passende organisatievorm bepalen op basis van coördinatiemechanismen." },
    { slug: "raci", name: "RACI-model", focus: "Rolverdeling en beslisverantwoordelijkheid expliciet maken." },
    { slug: "nadler-tushman", name: "Nadler-Tushman Congruence Model", focus: "Fit beoordelen tussen werk, mensen, formele en informele organisatie." },
    { slug: "weisbord-six-box", name: "Weisbord Six-Box Model", focus: "Organisatieproblemen diagnosticeren over zes kerngebieden." },
    { slug: "burke-litwin", name: "Burke-Litwin Model", focus: "Impact van externe en interne factoren op organisatieverandering analyseren." },
    { slug: "greiner-growth", name: "Greiner Growth Model", focus: "Groeifasen en bijbehorende organisatiecrises herkennen." },
    { slug: "matrix-structure", name: "Matrixorganisatiemodel", focus: "Balans en spanningen tussen functionele en productlijnsturing evalueren." },
    { slug: "span-of-control", name: "Span of Control", focus: "Managementspan en hiërarchische lagen optimaliseren." },
  ],
  processes: [
    { slug: "sipoc", name: "SIPOC", focus: "Procesgrenzen en ketenrelaties van leverancier tot klant verduidelijken." },
    { slug: "bpmn", name: "BPMN", focus: "Processtromen en overdrachten eenduidig modelleren." },
    { slug: "value-stream-mapping", name: "Value Stream Mapping", focus: "Verspilling en doorlooptijd in de waardestroom identificeren." },
    { slug: "dmaic", name: "DMAIC", focus: "Procesverbetering gestructureerd uitvoeren via Define, Measure, Analyze, Improve, Control." },
    { slug: "pdca", name: "PDCA-cyclus", focus: "Continue verbetering met iteratieve leerlussen organiseren." },
    { slug: "toc", name: "Theory of Constraints", focus: "Knelpunten in het systeem vinden en systematisch verhogen." },
    { slug: "lean-eight-wastes", name: "Lean Eight Wastes", focus: "Niet-waardetoevoegende activiteiten classificeren en reduceren." },
    { slug: "fishbone", name: "Ishikawa/Fishbone", focus: "Oorzaakanalyse van kwaliteits- of procesproblemen uitvoeren." },
    { slug: "five-whys", name: "5 Whys", focus: "Dieperliggende root causes van operationele issues achterhalen." },
    { slug: "service-blueprint", name: "Service Blueprint", focus: "Klantinteractie en backofficeprocessen in samenhang analyseren." },
  ],
  change: [
    { slug: "kotter-8-step", name: "Kotter 8-Step Model", focus: "Verandertrajecten structureren van urgentiebesef tot borging." },
    { slug: "adkar", name: "ADKAR-model", focus: "Individuele adoptie van verandering sturen van awareness tot reinforcement." },
    { slug: "lewin-3-stage", name: "Lewin 3-Stage Model", focus: "Verandering ontwerpen via unfreeze, change en refreeze." },
    { slug: "bridges-transition", name: "Bridges Transition Model", focus: "Psychologische overgang van medewerkers tijdens verandering begeleiden." },
    { slug: "kubler-ross-change", name: "Kubler-Ross Change Curve", focus: "Emotionele reacties op verandering herkennen en adresseren." },
    { slug: "mckinsey-influence", name: "McKinsey Influence Model", focus: "Gedragsverandering versnellen via rolmodellen, begrip, talent en formele mechanismen." },
    { slug: "satir-change", name: "Satir Change Model", focus: "Dynamiek van prestatie en onzekerheid gedurende verandering duiden." },
    { slug: "nudge-theory", name: "Nudge Theory", focus: "Gedrag subtiel sturen met keuze-architectuur." },
    { slug: "stakeholder-salience", name: "Stakeholder Salience Model", focus: "Prioriteit bepalen op basis van macht, legitimiteit en urgentie." },
    { slug: "force-field-analysis", name: "Force Field Analysis", focus: "Remmende en stimulerende krachten in een veranderopgave in balans brengen." },
  ],
  culture: [
    { slug: "schein-culture", name: "Schein Cultuurmodel", focus: "Cultuur analyseren op artefacten, beleden waarden en onderliggende aannames." },
    { slug: "competing-values", name: "Competing Values Framework", focus: "Dominante cultuurtypen en gewenste cultuurverschuiving in kaart brengen." },
    { slug: "hofstede", name: "Hofstede Cultuurdimensies", focus: "Nationale cultuurinvloeden op organisatiegedrag duiden." },
    { slug: "denison", name: "Denison Organisatiecultuurmodel", focus: "Cultuur koppelen aan betrokkenheid, consistentie, aanpassingsvermogen en missie." },
    { slug: "handy-culture", name: "Handy Cultuurtypen", focus: "Machts-, rol-, taak- en persoonscultuur onderscheiden." },
    { slug: "deal-kennedy", name: "Deal & Kennedy Cultuurmodel", focus: "Cultuurtypes beoordelen op risiconiveau en feedbacksnelheid." },
    { slug: "organizational-justice", name: "Organizational Justice Theory", focus: "Beleving van eerlijkheid in procedures, uitkomsten en interacties analyseren." },
    { slug: "psychological-safety", name: "Psychological Safety (Edmondson)", focus: "Spreekveiligheid en leerklimaat binnen teams beoordelen." },
    { slug: "social-identity", name: "Social Identity Theory", focus: "Wij-zij dynamieken en groepsvorming in organisaties verklaren." },
    { slug: "cultural-web", name: "Johnson & Scholes Cultural Web", focus: "Verhalen, routines, symbolen en machtspatronen als cultuurdragers analyseren." },
  ],
  leadership: [
    { slug: "situational-leadership", name: "Situational Leadership (Hersey-Blanchard)", focus: "Leiderschapsstijl afstemmen op taakvolwassenheid van medewerkers." },
    { slug: "transformational-leadership", name: "Transformationeel Leiderschap", focus: "Veranderkracht en motivatie vergroten via visie en inspiratie." },
    { slug: "transactional-leadership", name: "Transactioneel Leiderschap", focus: "Prestaties sturen met duidelijke doelen, afspraken en beloning." },
    { slug: "path-goal-theory", name: "Path-Goal Theory", focus: "Leiderschapsgedrag kiezen dat teamdoelen en motivatie ondersteunt." },
    { slug: "servant-leadership", name: "Servant Leadership", focus: "Leiderschap richten op groei en ontwikkeling van medewerkers." },
    { slug: "leader-member-exchange", name: "Leader-Member Exchange (LMX)", focus: "Kwaliteit van leider-medewerkerrelaties en teamimpact analyseren." },
    { slug: "leadership-pipeline", name: "Leadership Pipeline", focus: "Doorstroom en ontwikkelstappen tussen leiderschapsniveaus structureren." },
    { slug: "authentic-leadership", name: "Authentic Leadership", focus: "Consistentie tussen waarden, gedrag en vertrouwen in leiderschap versterken." },
    { slug: "emotional-intelligence", name: "Emotional Intelligence (Goleman)", focus: "Effect van zelfbewustzijn en emotieregulatie op leiderschap beoordelen." },
    { slug: "blake-mouton-grid", name: "Blake & Mouton Managerial Grid", focus: "Balans tussen mensgericht en taakgericht leiderschap evalueren." },
  ],
  hr_talent: [
    { slug: "nine-box-grid", name: "9-Box Grid", focus: "Talent beoordelen op performance en potentieel." },
    { slug: "amo-model", name: "AMO-model", focus: "Prestatie verklaren via Ability, Motivation en Opportunity." },
    { slug: "ulrich-hr-model", name: "Ulrich HR Model", focus: "HR-rollen structureren als strategic partner, expert, employee champion en change agent." },
    { slug: "high-performance-work-system", name: "High-Performance Work System", focus: "Samenhang van HR-praktijken richting hogere organisatieprestaties analyseren." },
    { slug: "expectancy-theory", name: "Expectancy Theory (Vroom)", focus: "Motivatieproblemen duiden via verwachting, instrumentaliteit en valentie." },
    { slug: "equity-theory", name: "Equity Theory (Adams)", focus: "Perceptie van eerlijkheid in beloning en inzet analyseren." },
    { slug: "herzberg-two-factor", name: "Herzberg Two-Factor Theory", focus: "Hygienefactoren en motivatoren in werkbeleving onderscheiden." },
    { slug: "competency-framework", name: "Competentiemodel", focus: "Benodigde kennis, vaardigheden en gedrag per rol expliciteren." },
    { slug: "succession-planning", name: "Succession Planning Model", focus: "Kritieke posities en opvolgingsrisico's beheersen." },
    { slug: "employee-lifecycle", name: "Employee Lifecycle Model", focus: "Instroom, ontwikkeling, behoud en uitstroom integraal optimaliseren." },
  ],
  innovation: [
    { slug: "diffusion-of-innovations", name: "Diffusion of Innovations (Rogers)", focus: "Adoptie van innovaties over doelgroepen en tijd voorspellen." },
    { slug: "three-horizons", name: "Three Horizons Model", focus: "Innovatieportfolio verdelen over korte, middellange en lange termijn." },
    { slug: "stage-gate", name: "Stage-Gate Model", focus: "Innovatieprojecten gefaseerd selecteren en sturen." },
    { slug: "design-thinking", name: "Design Thinking", focus: "Probleemoplossing mensgericht en iteratief ontwerpen." },
    { slug: "jobs-to-be-done", name: "Jobs-to-be-Done", focus: "Klantbehoeften begrijpen op basis van onderliggende 'jobs'." },
    { slug: "open-innovation", name: "Open Innovation (Chesbrough)", focus: "Externe kennis en partners benutten in innovatieprocessen." },
    { slug: "disruptive-innovation", name: "Disruptive Innovation (Christensen)", focus: "Risico en kans van marktverstorende innovaties beoordelen." },
    { slug: "technology-adoption-lifecycle", name: "Technology Adoption Lifecycle", focus: "Strategie afstemmen op adoptersegmenten van innovators tot laggards." },
    { slug: "lean-startup", name: "Lean Startup", focus: "Leren versnellen met build-measure-learn in onzekerheid." },
    { slug: "innovation-ambition-matrix", name: "Innovation Ambition Matrix", focus: "Innovatie-initiatieven balanceren tussen kern, aangrenzend en transformatief." },
  ],
  project: [
    { slug: "waterfall", name: "Watervalmodel", focus: "Projectfasering met sequentiele oplevering en formele besluitmomenten." },
    { slug: "prince2", name: "PRINCE2", focus: "Projectbesturing op basis van business case, rollen en managementproducten." },
    { slug: "pmbok-process-groups", name: "PMBOK Process Groups", focus: "Projectmanagement structureren via initiatie, planning, uitvoering, monitoring en afsluiting." },
    { slug: "critical-path-method", name: "Critical Path Method (CPM)", focus: "Kritieke activiteiten en planningrisico's identificeren." },
    { slug: "earned-value-management", name: "Earned Value Management", focus: "Voortgang en budgetprestatie integraal meten." },
    { slug: "stage-gate-project", name: "Stage-Gate (Projectbesturing)", focus: "Go/no-go beslissingen in meerfasige trajecten expliciteren." },
    { slug: "raid-framework", name: "RAID-framework", focus: "Risico's, aannames, issues en afhankelijkheden systematisch beheersen." },
    { slug: "agile-scrum", name: "Agile Scrum", focus: "Iteratieve levering en feedbackcycli in complexe projecten organiseren." },
    { slug: "kanban", name: "Kanban", focus: "Flow verbeteren via visueel werkbeheer en WIP-limieten." },
    { slug: "iron-triangle", name: "Iron Triangle", focus: "Trade-offs tussen scope, tijd en kosten expliciet maken." },
  ],
  finance: [
    { slug: "dupont-analysis", name: "DuPont-analyse", focus: "Rendement ontleden in marge, omloopsnelheid en leverage." },
    { slug: "eva", name: "Economic Value Added (EVA)", focus: "Waardecreatie beoordelen na kosten van kapitaal." },
    { slug: "activity-based-costing", name: "Activity-Based Costing (ABC)", focus: "Indirecte kosten toerekenen op basis van activiteiten." },
    { slug: "cost-volume-profit", name: "Cost-Volume-Profit (CVP)", focus: "Break-even en winstgevoeligheid bij volume- en prijsveranderingen analyseren." },
    { slug: "balanced-scorecard-finance", name: "Balanced Scorecard (Financieel perspectief)", focus: "Financiele doelen verbinden aan operationele sturing." },
    { slug: "altman-z-score", name: "Altman Z-score", focus: "Financiele gezondheid en faillissementsrisico indicatief beoordelen." },
    { slug: "value-based-management", name: "Value Based Management", focus: "Besluitvorming richten op lange termijn aandeelhouderswaarde." },
    { slug: "cash-conversion-cycle", name: "Cash Conversion Cycle", focus: "Werkkapitaal en liquiditeitsdruk in de keten analyseren." },
    { slug: "roic-framework", name: "ROIC-framework", focus: "Kapitaalefficiëntie en investeringskwaliteit beoordelen." },
    { slug: "sensitivity-analysis", name: "Sensitivity Analysis", focus: "Financiele impact van onzekerheden en scenario's doorrekenen." },
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

function modelImageForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return EXTERNAL_MODEL_IMAGE_URLS[hash % EXTERNAL_MODEL_IMAGE_URLS.length];
}

function buildModels(): AdvisoryModel[] {
  const out: AdvisoryModel[] = [];
  for (const cat of MODEL_CATEGORIES) {
    const blueprints = MODEL_BLUEPRINTS[cat.key];
    for (const bp of blueprints) {
      const id = `${cat.key}-${bp.slug}`;
      const extra = buildModelSpecificFields(cat.key, bp.name, bp.focus);
      out.push({
        id,
        name: bp.name,
        category: cat.key,
        categoryLabel: cat.label,
        description: `${bp.name} helpt bij ${bp.focus.toLowerCase()} binnen ${cat.label.toLowerCase()}.`,
        whenToUse: `Gebruik dit model wanneer je ${bp.focus.toLowerCase()} wilt onderzoeken en vertalen naar concrete adviezen.`,
        imageUrl: modelImageForId(id),
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
