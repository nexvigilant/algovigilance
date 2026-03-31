/**
 * MeSH to FAERS (MedDRA) Mapping Utility
 *
 * Cross-reference Medical Subject Headings (MeSH) from PubMed literature
 * with MedDRA preferred terms used in FAERS adverse event reporting.
 *
 * This enables:
 * - Finding relevant FAERS reactions for literature-identified safety signals
 * - Connecting academic research to regulatory safety data
 * - Building comprehensive safety profiles from both sources
 *
 * @example
 * ```ts
 * import { mapMeshToFaers, findRelatedMedDRA } from '@/lib/deep-research/mesh-faers-mapping';
 *
 * // Get FAERS-relevant terms for MeSH heading
 * const mapping = mapMeshToFaers('Cardiovascular Diseases');
 * log.info(mapping.meddraTerms); // ['Cardiac disorder', 'Cardiovascular disorder', ...]
 *
 * // Find related MedDRA for multiple MeSH terms
 * const related = findRelatedMedDRA(['Drug-Related Side Effects', 'Hepatotoxicity']);
 * ```
 */

// =============================================================================
// Types
// =============================================================================

export interface MeshToMedDRAMapping {
  meshTerm: string;
  meshTreeNumber?: string;
  meddraTerms: MedDRATerm[];
  confidence: 'high' | 'medium' | 'low';
  source: 'curated' | 'umls' | 'inferred';
}

export interface MedDRATerm {
  preferredTerm: string;
  soc: string; // System Organ Class
  hlgt?: string; // High Level Group Term
  hlt?: string; // High Level Term
  pt: string; // Preferred Term (same as preferredTerm)
  llt?: string[]; // Lower Level Terms
}

export interface FAERSReactionCategory {
  category: string;
  meshTerms: string[];
  meddraSOC: string;
  exampleReactions: string[];
}

// =============================================================================
// Core Mapping Data
// =============================================================================

/**
 * Curated MeSH → MedDRA SOC mappings for pharmacovigilance
 *
 * Based on UMLS metathesaurus relationships and expert curation.
 * This is a subset focused on common PV-relevant terms.
 */
const MESH_TO_MEDDRA_SOC: Record<string, string[]> = {
  // Cardiac
  'Cardiovascular Diseases': ['Cardiac disorders', 'Vascular disorders'],
  'Heart Diseases': ['Cardiac disorders'],
  'Arrhythmias, Cardiac': ['Cardiac disorders'],
  'Myocardial Infarction': ['Cardiac disorders'],
  'Heart Failure': ['Cardiac disorders'],
  'Tachycardia': ['Cardiac disorders'],
  'Bradycardia': ['Cardiac disorders'],
  'Atrial Fibrillation': ['Cardiac disorders'],
  'QT Prolongation': ['Cardiac disorders'],

  // Vascular
  'Vascular Diseases': ['Vascular disorders'],
  'Hypertension': ['Vascular disorders'],
  'Hypotension': ['Vascular disorders'],
  'Thrombosis': ['Vascular disorders'],
  'Embolism': ['Vascular disorders'],
  'Hemorrhage': ['Vascular disorders', 'Blood and lymphatic system disorders'],

  // Hepatic
  'Liver Diseases': ['Hepatobiliary disorders'],
  'Drug-Induced Liver Injury': ['Hepatobiliary disorders'],
  'Hepatotoxicity': ['Hepatobiliary disorders'],
  'Hepatitis': ['Hepatobiliary disorders'],
  'Cholestasis': ['Hepatobiliary disorders'],
  'Jaundice': ['Hepatobiliary disorders'],

  // Renal
  'Kidney Diseases': ['Renal and urinary disorders'],
  'Acute Kidney Injury': ['Renal and urinary disorders'],
  'Renal Insufficiency': ['Renal and urinary disorders'],
  'Nephrotoxicity': ['Renal and urinary disorders'],

  // Nervous System
  'Nervous System Diseases': ['Nervous system disorders'],
  'Seizures': ['Nervous system disorders'],
  'Headache': ['Nervous system disorders'],
  'Dizziness': ['Nervous system disorders'],
  'Stroke': ['Nervous system disorders'],
  'Neuropathy': ['Nervous system disorders'],
  'Tremor': ['Nervous system disorders'],

  // Psychiatric
  'Mental Disorders': ['Psychiatric disorders'],
  'Depression': ['Psychiatric disorders'],
  'Anxiety Disorders': ['Psychiatric disorders'],
  'Suicidal Ideation': ['Psychiatric disorders'],
  'Psychosis': ['Psychiatric disorders'],
  'Insomnia': ['Psychiatric disorders'],

  // Respiratory
  'Respiratory Tract Diseases': ['Respiratory, thoracic and mediastinal disorders'],
  'Dyspnea': ['Respiratory, thoracic and mediastinal disorders'],
  'Cough': ['Respiratory, thoracic and mediastinal disorders'],
  'Bronchospasm': ['Respiratory, thoracic and mediastinal disorders'],
  'Pulmonary Embolism': ['Respiratory, thoracic and mediastinal disorders'],

  // GI
  'Gastrointestinal Diseases': ['Gastrointestinal disorders'],
  'Nausea': ['Gastrointestinal disorders'],
  'Vomiting': ['Gastrointestinal disorders'],
  'Diarrhea': ['Gastrointestinal disorders'],
  'Constipation': ['Gastrointestinal disorders'],
  'Pancreatitis': ['Gastrointestinal disorders'],
  'Gastrointestinal Hemorrhage': ['Gastrointestinal disorders'],

  // Skin
  'Skin Diseases': ['Skin and subcutaneous tissue disorders'],
  'Drug Eruptions': ['Skin and subcutaneous tissue disorders'],
  'Stevens-Johnson Syndrome': ['Skin and subcutaneous tissue disorders'],
  'Toxic Epidermal Necrolysis': ['Skin and subcutaneous tissue disorders'],
  'Urticaria': ['Skin and subcutaneous tissue disorders'],
  'Angioedema': ['Skin and subcutaneous tissue disorders'],
  'Rash': ['Skin and subcutaneous tissue disorders'],

  // Immune
  'Immune System Diseases': ['Immune system disorders'],
  'Anaphylaxis': ['Immune system disorders'],
  'Drug Hypersensitivity': ['Immune system disorders'],
  'Hypersensitivity': ['Immune system disorders'],

  // Hematologic
  'Hematologic Diseases': ['Blood and lymphatic system disorders'],
  'Thrombocytopenia': ['Blood and lymphatic system disorders'],
  'Neutropenia': ['Blood and lymphatic system disorders'],
  'Anemia': ['Blood and lymphatic system disorders'],
  'Agranulocytosis': ['Blood and lymphatic system disorders'],

  // Endocrine
  'Endocrine System Diseases': ['Endocrine disorders'],
  'Hypoglycemia': ['Endocrine disorders', 'Metabolism and nutrition disorders'],
  'Hyperglycemia': ['Endocrine disorders', 'Metabolism and nutrition disorders'],
  'Thyroid Diseases': ['Endocrine disorders'],

  // Metabolic
  'Metabolic Diseases': ['Metabolism and nutrition disorders'],
  'Electrolyte Imbalance': ['Metabolism and nutrition disorders'],
  'Lactic Acidosis': ['Metabolism and nutrition disorders'],
  'Weight Gain': ['Metabolism and nutrition disorders'],
  'Weight Loss': ['Metabolism and nutrition disorders'],

  // Musculoskeletal
  'Musculoskeletal Diseases': ['Musculoskeletal and connective tissue disorders'],
  'Rhabdomyolysis': ['Musculoskeletal and connective tissue disorders'],
  'Myalgia': ['Musculoskeletal and connective tissue disorders'],
  'Arthralgia': ['Musculoskeletal and connective tissue disorders'],

  // Infections
  'Infection': ['Infections and infestations'],
  'Sepsis': ['Infections and infestations'],
  'Opportunistic Infections': ['Infections and infestations'],

  // Neoplasms
  'Neoplasms': ['Neoplasms benign, malignant and unspecified'],

  // General
  'Drug-Related Side Effects and Adverse Reactions': [
    'General disorders and administration site conditions',
  ],
  'Death': ['General disorders and administration site conditions'],
  'Fatigue': ['General disorders and administration site conditions'],
  'Pain': ['General disorders and administration site conditions'],
  'Edema': ['General disorders and administration site conditions'],
};

/**
 * Common FAERS reaction categories with associated MeSH terms
 */
const FAERS_CATEGORIES: FAERSReactionCategory[] = [
  {
    category: 'Cardiovascular Events',
    meshTerms: ['Cardiovascular Diseases', 'Heart Diseases', 'Myocardial Infarction', 'Stroke'],
    meddraSOC: 'Cardiac disorders',
    exampleReactions: ['Cardiac arrest', 'Myocardial infarction', 'Cardiac failure'],
  },
  {
    category: 'Hepatotoxicity',
    meshTerms: ['Drug-Induced Liver Injury', 'Hepatitis', 'Liver Diseases'],
    meddraSOC: 'Hepatobiliary disorders',
    exampleReactions: ['Hepatic failure', 'Drug-induced liver injury', 'Hepatitis'],
  },
  {
    category: 'Serious Skin Reactions',
    meshTerms: ['Stevens-Johnson Syndrome', 'Toxic Epidermal Necrolysis', 'Drug Eruptions'],
    meddraSOC: 'Skin and subcutaneous tissue disorders',
    exampleReactions: ['Stevens-Johnson syndrome', 'Toxic epidermal necrolysis', 'DRESS syndrome'],
  },
  {
    category: 'Anaphylaxis',
    meshTerms: ['Anaphylaxis', 'Drug Hypersensitivity', 'Angioedema'],
    meddraSOC: 'Immune system disorders',
    exampleReactions: ['Anaphylactic reaction', 'Anaphylactic shock', 'Hypersensitivity'],
  },
  {
    category: 'Suicidality',
    meshTerms: ['Suicidal Ideation', 'Suicide', 'Mental Disorders'],
    meddraSOC: 'Psychiatric disorders',
    exampleReactions: ['Suicidal ideation', 'Suicide attempt', 'Completed suicide'],
  },
  {
    category: 'QT Prolongation',
    meshTerms: ['Long QT Syndrome', 'Arrhythmias, Cardiac', 'Torsades de Pointes'],
    meddraSOC: 'Cardiac disorders',
    exampleReactions: ['Electrocardiogram QT prolonged', 'Torsade de pointes', 'Ventricular arrhythmia'],
  },
  {
    category: 'Rhabdomyolysis',
    meshTerms: ['Rhabdomyolysis', 'Muscular Diseases', 'Myopathy'],
    meddraSOC: 'Musculoskeletal and connective tissue disorders',
    exampleReactions: ['Rhabdomyolysis', 'Myopathy', 'Myositis'],
  },
  {
    category: 'Renal Toxicity',
    meshTerms: ['Acute Kidney Injury', 'Kidney Diseases', 'Nephrotoxicity'],
    meddraSOC: 'Renal and urinary disorders',
    exampleReactions: ['Acute kidney injury', 'Renal failure', 'Nephropathy toxic'],
  },
];

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Map a MeSH term to MedDRA System Organ Classes
 */
export function mapMeshToFaers(meshTerm: string): MeshToMedDRAMapping {
  const normalized = meshTerm.trim();

  // Direct lookup
  if (MESH_TO_MEDDRA_SOC[normalized]) {
    return {
      meshTerm: normalized,
      meddraTerms: MESH_TO_MEDDRA_SOC[normalized].map((soc) => ({
        preferredTerm: soc,
        soc,
        pt: soc,
      })),
      confidence: 'high',
      source: 'curated',
    };
  }

  // Fuzzy matching
  const fuzzyMatch = findFuzzyMatch(normalized);
  if (fuzzyMatch) {
    return {
      meshTerm: normalized,
      meddraTerms: MESH_TO_MEDDRA_SOC[fuzzyMatch].map((soc) => ({
        preferredTerm: soc,
        soc,
        pt: soc,
      })),
      confidence: 'medium',
      source: 'inferred',
    };
  }

  // No match found
  return {
    meshTerm: normalized,
    meddraTerms: [],
    confidence: 'low',
    source: 'inferred',
  };
}

/**
 * Find related MedDRA terms for multiple MeSH terms
 */
export function findRelatedMedDRA(meshTerms: string[]): Map<string, MeshToMedDRAMapping> {
  const results = new Map<string, MeshToMedDRAMapping>();

  for (const term of meshTerms) {
    results.set(term, mapMeshToFaers(term));
  }

  return results;
}

/**
 * Get all MeSH terms that map to a specific MedDRA SOC
 */
export function getMeshForSOC(soc: string): string[] {
  const matches: string[] = [];

  for (const [mesh, socs] of Object.entries(MESH_TO_MEDDRA_SOC)) {
    if (socs.some((s) => s.toLowerCase() === soc.toLowerCase())) {
      matches.push(mesh);
    }
  }

  return matches;
}

/**
 * Get FAERS reaction categories relevant to given MeSH terms
 */
export function getRelevantFAERSCategories(meshTerms: string[]): FAERSReactionCategory[] {
  const normalizedInput = new Set(meshTerms.map((t) => t.toLowerCase()));

  return FAERS_CATEGORIES.filter((category) =>
    category.meshTerms.some((mesh) => normalizedInput.has(mesh.toLowerCase()))
  );
}

/**
 * Build a FAERS search query from MeSH terms
 */
export function buildFAERSQuery(meshTerms: string[]): string {
  const meddraTerms = new Set<string>();

  for (const mesh of meshTerms) {
    const mapping = mapMeshToFaers(mesh);
    for (const term of mapping.meddraTerms) {
      meddraTerms.add(term.preferredTerm);
    }
  }

  // Format as FAERS reaction terms (would be used in FAERS query)
  return Array.from(meddraTerms)
    .map((t) => `"${t}"`)
    .join(' OR ');
}

/**
 * Get suggested literature MeSH terms for a FAERS reaction
 */
export function suggestMeshForReaction(reaction: string): string[] {
  const normalizedReaction = reaction.toLowerCase();
  const suggestions: string[] = [];

  // Reverse lookup
  for (const [mesh, socs] of Object.entries(MESH_TO_MEDDRA_SOC)) {
    for (const soc of socs) {
      if (
        soc.toLowerCase().includes(normalizedReaction) ||
        normalizedReaction.includes(soc.toLowerCase())
      ) {
        suggestions.push(mesh);
      }
    }
  }

  // Check categories
  for (const category of FAERS_CATEGORIES) {
    if (
      category.exampleReactions.some((r) =>
        r.toLowerCase().includes(normalizedReaction) ||
        normalizedReaction.includes(r.toLowerCase())
      )
    ) {
      suggestions.push(...category.meshTerms);
    }
  }

  return [...new Set(suggestions)];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find fuzzy match for a MeSH term
 */
function findFuzzyMatch(term: string): string | null {
  const normalized = term.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const mesh of Object.keys(MESH_TO_MEDDRA_SOC)) {
    const meshLower = mesh.toLowerCase();

    // Check for containment
    if (meshLower.includes(normalized) || normalized.includes(meshLower)) {
      const score = Math.min(normalized.length, meshLower.length) /
        Math.max(normalized.length, meshLower.length);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = mesh;
      }
    }
  }

  return bestScore > 0.5 ? bestMatch : null;
}

// =============================================================================
// Summary Statistics
// =============================================================================

/**
 * Get mapping coverage statistics
 */
export function getMappingStats(): {
  totalMeshTerms: number;
  totalSOCs: number;
  categories: number;
} {
  const socs = new Set<string>();
  for (const socList of Object.values(MESH_TO_MEDDRA_SOC)) {
    for (const soc of socList) {
      socs.add(soc);
    }
  }

  return {
    totalMeshTerms: Object.keys(MESH_TO_MEDDRA_SOC).length,
    totalSOCs: socs.size,
    categories: FAERS_CATEGORIES.length,
  };
}

// =============================================================================
// FAERS API Types
// =============================================================================

export interface FAERSQueryOptions {
  /** Drug name to search */
  drugName?: string;
  /** Reaction terms (MedDRA preferred terms) */
  reactions?: string[];
  /** Date range for reports */
  dateRange?: { from: string; to: string };
  /** Maximum results to return */
  limit?: number;
  /** Skip first N results */
  skip?: number;
  /** openFDA API key (optional, increases rate limit) */
  apiKey?: string;
}

export interface FAERSResult {
  /** Raw API response */
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  /** Adverse event reports */
  results: FAERSReport[];
}

export interface FAERSReport {
  safetyreportid: string;
  receivedate: string;
  receiptdate?: string;
  serious?: number;
  seriousnessdeath?: number;
  seriousnesslifethreatening?: number;
  seriousnesshospitalization?: number;
  seriousnessdisabling?: number;
  patient?: {
    reaction?: Array<{
      reactionmeddrapt: string;
      reactionoutcome?: number;
    }>;
    drug?: Array<{
      medicinalproduct?: string;
      drugindication?: string;
      drugcharacterization?: number;
      activesubstance?: {
        activesubstancename: string;
      };
    }>;
  };
}

export interface FAERSReactionCount {
  reaction: string;
  count: number;
  seriousCount: number;
  deathCount: number;
}

export interface FAERSSearchResult {
  /** Query that was executed */
  query: string;
  /** Total matching reports */
  totalReports: number;
  /** Fetched reports */
  reports: FAERSReport[];
  /** Aggregated reaction counts */
  reactionCounts: FAERSReactionCount[];
  /** Search timestamp */
  timestamp: Date;
}

// =============================================================================
// FAERS API Constants
// =============================================================================

const FAERS_API_BASE = 'https://api.fda.gov/drug/event.json';

// =============================================================================
// FAERS Query Execution
// =============================================================================

/**
 * Execute a query against the openFDA FAERS API
 */
export async function executeFAERSQuery(
  options: FAERSQueryOptions
): Promise<FAERSResult | null> {
  const { drugName, reactions, dateRange, limit = 100, skip = 0, apiKey } = options;

  // Build search query
  const searchTerms: string[] = [];

  if (drugName) {
    // Search in both brand name and generic name fields
    searchTerms.push(
      `(patient.drug.medicinalproduct:"${drugName}"+patient.drug.activesubstance.activesubstancename:"${drugName}")`
    );
  }

  if (reactions && reactions.length > 0) {
    const reactionQuery = reactions
      .map((r) => `patient.reaction.reactionmeddrapt:"${r}"`)
      .join('+');
    searchTerms.push(`(${reactionQuery})`);
  }

  if (dateRange) {
    searchTerms.push(`receivedate:[${dateRange.from}+TO+${dateRange.to}]`);
  }

  if (searchTerms.length === 0) {
    return null;
  }

  // Build URL
  const params = new URLSearchParams({
    search: searchTerms.join('+AND+'),
    limit: String(limit),
    skip: String(skip),
  });

  if (apiKey) {
    params.set('api_key', apiKey);
  }

  const url = `${FAERS_API_BASE}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        // No results found
        return {
          meta: {
            disclaimer: '',
            terms: '',
            license: '',
            last_updated: '',
            results: { skip: 0, limit, total: 0 },
          },
          results: [],
        };
      }
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Search FAERS using MeSH terms (maps to MedDRA automatically)
 */
export async function searchFAERSByMeSH(
  meshTerms: string[],
  options: Omit<FAERSQueryOptions, 'reactions'> = {}
): Promise<FAERSSearchResult | null> {
  // Map MeSH terms to MedDRA SOCs
  const meddraTerms = new Set<string>();
  for (const mesh of meshTerms) {
    const mapping = mapMeshToFaers(mesh);
    for (const term of mapping.meddraTerms) {
      meddraTerms.add(term.preferredTerm);
    }
  }

  if (meddraTerms.size === 0) {
    return null;
  }

  const result = await executeFAERSQuery({
    ...options,
    reactions: Array.from(meddraTerms),
  });

  if (!result) return null;

  // Aggregate reaction counts
  const reactionCounts = aggregateReactionCounts(result.results);

  return {
    query: buildFAERSQuery(meshTerms),
    totalReports: result.meta.results.total,
    reports: result.results,
    reactionCounts,
    timestamp: new Date(),
  };
}

/**
 * Get reaction counts for a specific drug
 */
export async function getFAERSReactionCounts(
  drugName: string,
  options: { limit?: number; apiKey?: string } = {}
): Promise<FAERSReactionCount[]> {
  const result = await executeFAERSQuery({
    drugName,
    limit: options.limit || 1000,
    apiKey: options.apiKey,
  });

  if (!result || result.results.length === 0) {
    return [];
  }

  return aggregateReactionCounts(result.results);
}

/**
 * Get FAERS reports matching MeSH-derived reactions for a drug
 */
export async function searchDrugByMeSHReactions(
  drugName: string,
  meshTerms: string[],
  options: { limit?: number; apiKey?: string; dateRange?: { from: string; to: string } } = {}
): Promise<FAERSSearchResult | null> {
  // Map MeSH to MedDRA
  const meddraTerms = new Set<string>();
  for (const mesh of meshTerms) {
    const mapping = mapMeshToFaers(mesh);
    for (const term of mapping.meddraTerms) {
      meddraTerms.add(term.preferredTerm);
    }
  }

  const result = await executeFAERSQuery({
    drugName,
    reactions: Array.from(meddraTerms),
    limit: options.limit,
    apiKey: options.apiKey,
    dateRange: options.dateRange,
  });

  if (!result) return null;

  return {
    query: `Drug: ${drugName} AND Reactions: ${buildFAERSQuery(meshTerms)}`,
    totalReports: result.meta.results.total,
    reports: result.results,
    reactionCounts: aggregateReactionCounts(result.results),
    timestamp: new Date(),
  };
}

// =============================================================================
// FAERS Result Helpers
// =============================================================================

/**
 * Aggregate reaction counts from FAERS reports
 */
function aggregateReactionCounts(reports: FAERSReport[]): FAERSReactionCount[] {
  const counts = new Map<string, { total: number; serious: number; death: number }>();

  for (const report of reports) {
    const isSerious = report.serious === 1;
    const isDeath = report.seriousnessdeath === 1;

    for (const reaction of report.patient?.reaction || []) {
      const name = reaction.reactionmeddrapt;
      if (!name) continue;

      const current = counts.get(name) || { total: 0, serious: 0, death: 0 };
      current.total++;
      if (isSerious) current.serious++;
      if (isDeath) current.death++;
      counts.set(name, current);
    }
  }

  // Convert to array and sort by count
  return Array.from(counts.entries())
    .map(([reaction, data]) => ({
      reaction,
      count: data.total,
      seriousCount: data.serious,
      deathCount: data.death,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Filter FAERS reports by seriousness criteria
 */
export function filterSeriousReports(
  reports: FAERSReport[],
  criteria: {
    death?: boolean;
    lifeThreatening?: boolean;
    hospitalization?: boolean;
    disabling?: boolean;
  } = {}
): FAERSReport[] {
  return reports.filter((report) => {
    if (criteria.death && report.seriousnessdeath !== 1) return false;
    if (criteria.lifeThreatening && report.seriousnesslifethreatening !== 1) return false;
    if (criteria.hospitalization && report.seriousnesshospitalization !== 1) return false;
    if (criteria.disabling && report.seriousnessdisabling !== 1) return false;
    return true;
  });
}

/**
 * Extract unique drugs from FAERS reports
 */
export function extractDrugsFromReports(reports: FAERSReport[]): string[] {
  const drugs = new Set<string>();

  for (const report of reports) {
    for (const drug of report.patient?.drug || []) {
      if (drug.medicinalproduct) {
        drugs.add(drug.medicinalproduct);
      }
      if (drug.activesubstance?.activesubstancename) {
        drugs.add(drug.activesubstance.activesubstancename);
      }
    }
  }

  return Array.from(drugs).sort();
}
