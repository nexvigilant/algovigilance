/**
 * Domain Translation Maps — Cross-domain architecture visualization.
 *
 * Each "lens" translates the 10 core system components into the vocabulary
 * of a professional domain. Backed by T1 primitive decomposition:
 * every translation preserves the same structural relationships (→, ∂, μ, κ)
 * while swapping surface terminology.
 *
 * Primitive formula: lens = μ(domain_source, domain_target) — mapping between domains.
 */

export type SystemComponent =
  | 'foundation'
  | 'domain'
  | 'orchestration'
  | 'service'
  | 'eventFlow'
  | 'security'
  | 'dataPipeline'
  | 'frontend'
  | 'configuration'
  | 'compute'

export interface DomainTranslation {
  /** Name in target domain vocabulary */
  name: string
  /** One-line description */
  description: string
  /** T1 primitives that enable this translation */
  primitives: string[]
  /** Translation confidence 0-1 (structural similarity) */
  confidence: number
}

export interface DomainLens {
  id: string
  name: string
  /** Short tagline */
  tagline: string
  /** Hex accent color */
  color: string
  /** Whether this lens is fully implemented */
  available: boolean
  translations: Record<SystemComponent, DomainTranslation>
}

/** Canonical software component names */
export const SYSTEM_COMPONENTS: Record<SystemComponent, { name: string; crate: string }> = {
  foundation: { name: 'Foundation Layer', crate: 'nexcore-primitives' },
  domain: { name: 'Domain Engine', crate: 'nexcore-vigilance' },
  orchestration: { name: 'Orchestration', crate: 'nexcore-brain + friday' },
  service: { name: 'Service Interface', crate: 'nexcore-mcp + api' },
  eventFlow: { name: 'Event Flow', crate: 'nexcore-cytokine' },
  security: { name: 'Quality & Security', crate: 'nexcore-immunity' },
  dataPipeline: { name: 'Data Pipeline', crate: 'nexcore-faers-etl' },
  frontend: { name: 'Frontend / UI', crate: 'Next.js 16' },
  configuration: { name: 'Configuration', crate: 'nexcore-hormones' },
  compute: { name: 'Compute (195 crates)', crate: 'Cargo workspace' },
}

export const DOMAIN_LENSES: DomainLens[] = [
  // ─── Biology (reference lens — fully mapped) ─────────────────────────────────
  {
    id: 'biology',
    name: 'Biology',
    tagline: 'Anatomy & Physiology',
    color: '#14b8a6',
    available: true,
    translations: {
      foundation: { name: 'Skeleton', description: '15 vertebrae (Lex Primitiva) — structural framework', primitives: ['∃', 'π', 'σ'], confidence: 0.97 },
      domain: { name: 'Stomach', description: '57-module digestive engine with strict type-checking acid', primitives: ['μ', '∂', 'κ'], confidence: 0.95 },
      orchestration: { name: 'Brain + Brainstem', description: 'Cerebrum (decisions) + autonomic (event routing)', primitives: ['→', 'ς', 'ρ'], confidence: 0.96 },
      service: { name: 'Lungs', description: '458 alveoli (MCP tools) — gas exchange with environment', primitives: ['∂', 'ν', 'N'], confidence: 0.93 },
      eventFlow: { name: 'Cytokines', description: 'IL-1 errors, IL-6 warnings, TNF-α critical, IL-10 recovery', primitives: ['→', 'ν', 'ς'], confidence: 0.98 },
      security: { name: 'Immune System', description: 'B-cells (antibodies) + T-cells (adversarial testing)', primitives: ['κ', '∂', 'π'], confidence: 0.97 },
      dataPipeline: { name: 'Digestive Tract', description: 'Mouth → esophagus → stomach → intestines → liver', primitives: ['σ', '→', 'μ'], confidence: 0.94 },
      frontend: { name: 'Skin', description: 'Epidermis (static) + dermis (interactive) + hypodermis (data)', primitives: ['∂', 'λ', '∃'], confidence: 0.91 },
      configuration: { name: 'Endocrine Glands', description: 'Hypothalamus (CLAUDE.md) → pituitary → target glands', primitives: ['→', 'ν', 'π'], confidence: 0.95 },
      compute: { name: '195 Muscles', description: 'Type I (slow-twitch foundation) to Type IIb (explosive service)', primitives: ['N', 'Σ', '→'], confidence: 0.89 },
    },
  },

  // ─── Clinical Trials ─────────────────────────────────────────────────────────
  {
    id: 'clinical',
    name: 'Clinical Trials',
    tagline: 'ICH-GCP Framework',
    color: '#f43f5e',
    available: true,
    translations: {
      foundation: { name: 'ICH-GCP Guidelines', description: 'Fundamental regulatory framework that all trials build upon', primitives: ['∃', 'π', '∂'], confidence: 0.94 },
      domain: { name: 'Study Protocol', description: 'Primary efficacy endpoints, inclusion/exclusion, dosing — the core logic', primitives: ['μ', 'κ', 'N'], confidence: 0.96 },
      orchestration: { name: 'CRO / Sponsor', description: 'Clinical Research Organization — coordinates sites, data, regulators', primitives: ['→', 'ς', 'σ'], confidence: 0.93 },
      service: { name: 'EDC System', description: 'Electronic Data Capture — 458 CRF fields (one per MCP tool)', primitives: ['∂', 'N', 'μ'], confidence: 0.90 },
      eventFlow: { name: 'SAE Reporting', description: 'Serious Adverse Event cascade: site → sponsor → IRB → FDA (≤24h)', primitives: ['→', 'ν', '∝'], confidence: 0.97 },
      security: { name: 'DSMB', description: 'Data Safety Monitoring Board — can halt trial for safety signals', primitives: ['κ', '∂', '∝'], confidence: 0.96 },
      dataPipeline: { name: 'Data Management', description: 'CRF entry → query resolution → database lock → statistical analysis', primitives: ['σ', '→', 'μ'], confidence: 0.95 },
      frontend: { name: 'Patient Portal', description: 'Consent forms, visit schedules, ePRO — what subjects interact with', primitives: ['∂', 'λ', '∃'], confidence: 0.88 },
      configuration: { name: 'Protocol Amendments', description: 'System-wide changes that propagate to every site simultaneously', primitives: ['→', 'ν', 'π'], confidence: 0.94 },
      compute: { name: '195 Study Sites', description: 'Each site = one crate. Enrolling, treating, reporting independently', primitives: ['N', 'Σ', 'λ'], confidence: 0.87 },
    },
  },

  // ─── Chemistry ───────────────────────────────────────────────────────────────
  {
    id: 'chemistry',
    name: 'Chemistry',
    tagline: 'Molecular Systems',
    color: '#f59e0b',
    available: true,
    translations: {
      foundation: { name: 'Periodic Table', description: '15 elements (primitives) — irreducible building blocks of all matter', primitives: ['∃', 'N', 'κ'], confidence: 0.95 },
      domain: { name: 'Reaction Vessel', description: 'Where substrates meet catalysts under controlled conditions (pH, temp)', primitives: ['μ', '∂', 'ν'], confidence: 0.92 },
      orchestration: { name: 'Catalyst', description: 'Lowers activation energy, coordinates reactions without being consumed', primitives: ['→', 'ς', 'ρ'], confidence: 0.94 },
      service: { name: 'Solution Interface', description: 'Dissolution boundary where reactants meet solvent (458 solubility points)', primitives: ['∂', 'N', 'μ'], confidence: 0.88 },
      eventFlow: { name: 'Electron Transfer', description: 'Redox chain: oxidation (emit) → reduction (receive) signal electrons', primitives: ['→', 'ν', 'ς'], confidence: 0.93 },
      security: { name: 'Buffer System', description: 'pH homeostasis — neutralizes acid/base threats to maintain stability', primitives: ['κ', '∂', 'π'], confidence: 0.96 },
      dataPipeline: { name: 'Distillation Column', description: 'Crude mixture → fractional separation → pure compounds → waste', primitives: ['σ', '→', 'κ'], confidence: 0.91 },
      frontend: { name: 'Crystal Lattice', description: 'Visible ordered structure — what observers see and measure', primitives: ['∂', 'λ', 'σ'], confidence: 0.85 },
      configuration: { name: 'Concentration', description: 'Molarity propagates to all reactions simultaneously — one change, all respond', primitives: ['→', 'N', 'ν'], confidence: 0.90 },
      compute: { name: '195 Molecular Bonds', description: 'Covalent (tight coupling) to ionic (loose coupling) to van der Waals (optional)', primitives: ['N', 'Σ', '→'], confidence: 0.86 },
    },
  },

  // ─── Military ────────────────────────────────────────────────────────────────
  {
    id: 'military',
    name: 'Military',
    tagline: 'Command & Control',
    color: '#6b7280',
    available: true,
    translations: {
      foundation: { name: 'Doctrine & Regulations', description: 'Standing orders that every unit follows — non-negotiable fundamentals', primitives: ['∃', 'π', '∂'], confidence: 0.93 },
      domain: { name: 'Theater Operations', description: 'Combat units executing the mission with intelligence and firepower', primitives: ['μ', 'κ', 'N'], confidence: 0.91 },
      orchestration: { name: 'Command & Control (C2)', description: 'Chain of command: strategic → operational → tactical decision layers', primitives: ['→', 'ς', 'σ'], confidence: 0.95 },
      service: { name: 'Communications (SIGINT)', description: '458 radio frequencies (tools) — voice, data, satellite, encrypted', primitives: ['∂', 'ν', 'N'], confidence: 0.89 },
      eventFlow: { name: 'Logistics Chain', description: 'Supply → transport → distribute — ammunition, fuel, food, intelligence', primitives: ['→', 'σ', 'ν'], confidence: 0.92 },
      security: { name: 'Force Protection', description: 'Perimeter defense + counterintelligence + threat detection patrols', primitives: ['κ', '∂', '∝'], confidence: 0.96 },
      dataPipeline: { name: 'Intelligence Cycle', description: 'Collection → processing → analysis → dissemination → feedback', primitives: ['σ', '→', 'μ'], confidence: 0.94 },
      frontend: { name: 'Public Affairs', description: 'What the public and media see — controlled information release', primitives: ['∂', 'λ', '∃'], confidence: 0.87 },
      configuration: { name: 'Rules of Engagement', description: 'ROE changes propagate to every unit — one order, system-wide effect', primitives: ['→', 'ν', 'π'], confidence: 0.95 },
      compute: { name: '195 Battalions', description: 'Infantry (foundation) to armor (domain) to special ops (service)', primitives: ['N', 'Σ', 'λ'], confidence: 0.88 },
    },
  },

  // ─── City Infrastructure ─────────────────────────────────────────────────────
  {
    id: 'city',
    name: 'City Infrastructure',
    tagline: 'Urban Planning',
    color: '#8b5cf6',
    available: false,
    translations: {
      foundation: { name: 'Bedrock & Utilities', description: 'Water mains, power grid, sewage — invisible but load-bearing', primitives: ['∃', 'π', 'σ'], confidence: 0.90 },
      domain: { name: 'City Services', description: 'Hospitals, courts, schools — where the real work of the city happens', primitives: ['μ', 'κ', 'N'], confidence: 0.88 },
      orchestration: { name: 'City Hall', description: 'Mayor + administration — coordinates all departments and services', primitives: ['→', 'ς', 'σ'], confidence: 0.92 },
      service: { name: 'Roads & Transit', description: 'Highways, ports, airports — how things enter and leave the city', primitives: ['∂', 'ν', 'N'], confidence: 0.89 },
      eventFlow: { name: 'Postal System', description: 'Letters, packages, couriers — carrying messages between all addresses', primitives: ['→', 'σ', 'ν'], confidence: 0.86 },
      security: { name: 'Police & Fire', description: 'Law enforcement patrols + fire stations — threat response infrastructure', primitives: ['κ', '∂', '∝'], confidence: 0.93 },
      dataPipeline: { name: 'Water Treatment', description: 'River intake → filtration → treatment → distribution → wastewater', primitives: ['σ', '→', 'μ'], confidence: 0.91 },
      frontend: { name: 'Storefronts & Parks', description: 'What citizens see and interact with daily — the face of the city', primitives: ['∂', 'λ', '∃'], confidence: 0.85 },
      configuration: { name: 'Zoning Laws', description: 'One regulation change affects every building permit in the city', primitives: ['→', 'ν', 'π'], confidence: 0.90 },
      compute: { name: '195 Buildings', description: 'Residential (foundation) to commercial (domain) to government (service)', primitives: ['N', 'Σ', 'λ'], confidence: 0.84 },
    },
  },

  // ─── Orchestra ───────────────────────────────────────────────────────────────
  {
    id: 'orchestra',
    name: 'Orchestra',
    tagline: 'Musical Ensemble',
    color: '#eab308',
    available: false,
    translations: {
      foundation: { name: 'Music Theory', description: 'Scales, intervals, keys, time signatures — the grammar of all music', primitives: ['∃', 'σ', 'ν'], confidence: 0.91 },
      domain: { name: 'Instrument Sections', description: 'Strings, brass, woodwinds, percussion — each with unique timbre', primitives: ['μ', 'κ', 'N'], confidence: 0.89 },
      orchestration: { name: 'Conductor', description: 'Tempo, dynamics, cues, balance — coordinates 195 musicians in real-time', primitives: ['→', 'ς', 'σ'], confidence: 0.97 },
      service: { name: 'Concert Hall', description: 'Acoustics, seating, program — the interface between music and audience', primitives: ['∂', 'ν', 'λ'], confidence: 0.86 },
      eventFlow: { name: 'Musical Score', description: 'Written notation flowing L→R through time — events as notes on staves', primitives: ['→', 'σ', 'ν'], confidence: 0.93 },
      security: { name: 'Tuning System', description: 'A440 reference pitch — intonation errors detected and corrected instantly', primitives: ['κ', '∂', 'ν'], confidence: 0.88 },
      dataPipeline: { name: 'Rehearsal Process', description: 'Sight-read → section practice → tutti rehearsal → dress → performance', primitives: ['σ', '→', 'μ'], confidence: 0.90 },
      frontend: { name: 'Stage & Lighting', description: 'What the audience experiences — visual spectacle framing the sound', primitives: ['∂', 'λ', '∃'], confidence: 0.83 },
      configuration: { name: 'Key Signature', description: 'One modulation changes every note in the piece — system-wide harmonic shift', primitives: ['→', 'ν', 'π'], confidence: 0.92 },
      compute: { name: '195 Musicians', description: 'First violins (foundation) to soloists (service) — each reading the same score', primitives: ['N', 'Σ', 'λ'], confidence: 0.87 },
    },
  },
]

/** Get a single lens by ID */
export function getLens(id: string): DomainLens | undefined {
  return DOMAIN_LENSES.find(l => l.id === id)
}

/** Get all available (implemented) lenses */
export function getAvailableLenses(): DomainLens[] {
  return DOMAIN_LENSES.filter(l => l.available)
}
