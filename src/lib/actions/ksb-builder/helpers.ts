// Shared helper utilities — no 'use server' (pure synchronous functions, not server actions)

import type { AuthorityLevel, ResearchData, CapabilityComponent, CoverageScore } from '@/types/pv-curriculum';
import { toDateFromSerialized } from '@/types/academy';
import type { KSBLibraryEntry, EnhancedKSBInput, EnhancedCitation } from './types';

// ============================================================================
// Timestamp Serialization
// ============================================================================

/**
 * Serialize Firestore Timestamps recursively for Client Components.
 * Converts Timestamp objects (and plain Date) to ISO strings.
 */
export function serializeTimestamps<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'object' && obj !== null) {
    const anyObj = obj as Record<string, unknown>;

    // Firestore Timestamp with toDate method
    if (typeof anyObj.toDate === 'function') {
      return (toDateFromSerialized(anyObj) as Date).toISOString() as unknown as T;
    }

    // Firestore Timestamp with _seconds (from serialized data)
    if ('_seconds' in anyObj && '_nanoseconds' in anyObj) {
      const seconds = anyObj._seconds as number;
      const nanoseconds = anyObj._nanoseconds as number;
      return new Date(seconds * 1000 + nanoseconds / 1000000).toISOString() as unknown as T;
    }

    // Date object
    if (obj instanceof Date) {
      return obj.toISOString() as unknown as T;
    }

    // Array
    if (Array.isArray(obj)) {
      return obj.map(item => serializeTimestamps(item)) as unknown as T;
    }

    // Regular object — recurse
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeTimestamps(value);
    }
    return result as T;
  }

  return obj;
}

// ============================================================================
// Research Quality Calculation
// ============================================================================

export function calculateResearchQuality(research: ResearchData): number {
  let score = 0;

  // Base score from source count (up to 30 points)
  score += Math.min(research.sourceCount * 10, 30);

  // Primary sources bonus (up to 30 points)
  score += Math.min((research.primarySourceCount || 0) * 15, 30);

  // Coverage areas (up to 25 points)
  if (research.coverageAreas) {
    const areas = Object.values(research.coverageAreas);
    const covered = areas.filter(Boolean).length;
    score += (covered / areas.length) * 25;
  }

  // Authority level bonus (up to 15 points)
  const authorityScores: Record<AuthorityLevel, number> = {
    regulatory: 15,
    guidance: 12,
    industry_standard: 9,
    peer_reviewed: 6,
    expert_opinion: 3,
    internal: 0,
  };
  score += authorityScores[research.authorityLevel] || 0;

  return Math.min(Math.round(score), 100);
}

// ============================================================================
// Coverage Score Calculation
// ============================================================================

/**
 * Calculate CoverageScore from ResearchData
 */
export function calculateCoverageScoreFromResearch(research: Partial<ResearchData>): CoverageScore {
  // Calculate component scores
  const definitionScore = research.coverageAreas?.definition ? 100 : 0;
  const regulationsScore = research.coverageAreas?.regulations ? 100 : 0;
  const bestPracticesScore = research.coverageAreas?.bestPractices ? 100 : 0;
  const examplesScore = research.coverageAreas?.examples ? 100 : 0;
  const assessmentScore = research.coverageAreas?.assessmentCriteria ? 100 : 0;

  // Context score based on citations
  const contextScore = Math.min((research.sourceCount || 0) * 25, 100);

  // Common errors — derive from authority level
  const commonErrorsScore =
    research.authorityLevel === 'regulatory' || research.authorityLevel === 'guidance' ? 80 : 40;

  const scores = {
    definition: definitionScore,
    context: contextScore,
    regulations: regulationsScore,
    bestPractices: bestPracticesScore,
    examples: examplesScore,
    commonErrors: commonErrorsScore,
    assessmentCriteria: assessmentScore,
  };

  // Calculate overall score
  const overall = Math.round(
    (definitionScore + contextScore + regulationsScore + bestPracticesScore +
      examplesScore + commonErrorsScore + assessmentScore) / 7
  );

  // Determine blockers
  const blockers: CoverageScore['blockers'] = [];

  if ((research.sourceCount || 0) === 0) {
    blockers.push({
      type: 'missing_research',
      severity: 'critical',
      description: 'No citations available',
    });
  }

  if ((research.primarySourceCount || 0) === 0) {
    blockers.push({
      type: 'missing_research',
      severity: 'major',
      description: 'No regulatory sources',
    });
  }

  if (!research.coverageAreas?.regulations) {
    blockers.push({
      type: 'missing_research',
      severity: 'major',
      description: 'Regulatory requirements not documented',
    });
  }

  return {
    scores,
    overall,
    blockers,
    lastAuditedAt: new Date(),
    auditedBy: research.researchedBy,
  };
}

// ============================================================================
// Enhanced KSB Input Builders
// ============================================================================

function buildFromResearchData(ksb: CapabilityComponent): EnhancedKSBInput {
  const research = ksb.research;
  if (!research) {
    throw new Error('buildFromResearchData called without research data');
  }

  // Transform citations to enhanced format
  const citations: EnhancedCitation[] = research.citations.map(c => ({
    type: c.type,
    title: c.title,
    source: c.source,
    identifier: c.identifier,
    section: c.section,
    relevanceScore: c.relevanceScore,
    notes: c.notes,
  }));

  // Build regulatory context
  let regulatoryContext: EnhancedKSBInput['regulatoryContext'] | undefined;
  if (ksb.regulatoryContext) {
    regulatoryContext = {
      primaryRegion: ksb.regulatoryContext.primaryRegion,
      guidelines: ksb.regulatoryContext.applicableGuidelines?.map(g =>
        g.code ? `${g.code}${g.section ? ` ${g.section}` : ''}` : g.title
      ) || [],
      regionalVariations: ksb.regulatoryContext.regionalVariations?.map(v =>
        `${v.region}: ${v.variation}`
      ),
    };
  }

  return {
    id: ksb.id,
    ksbCode: ksb.id,
    title: ksb.itemName,
    description: ksb.itemDescription,
    type: ksb.type,
    proficiencyLevel: ksb.proficiencyLevel || 'L3',
    bloomLevel: ksb.bloomLevel || 'Apply',
    keywords: ksb.keywords || [],
    researchQuality: calculateResearchQuality(research),
    citationCount: research.citations.length,
    authorityLevel: research.authorityLevel,
    citations,
    regulatoryContext,
    coverageAreas: research.coverageAreas,
    dataSource: 'research_data',
  };
}

function buildFromLibraryEntry(
  ksb: CapabilityComponent,
  entry: KSBLibraryEntry
): EnhancedKSBInput {
  return {
    id: ksb.id,
    ksbCode: entry.ksbCode,
    title: entry.title,
    description: entry.description,
    type: ksb.type,
    proficiencyLevel: ksb.proficiencyLevel || 'L3',
    bloomLevel: ksb.bloomLevel || 'Apply',
    keywords: entry.keywords,
    researchQuality: entry.researchQuality,
    citationCount: entry.citations || 0,
    authorityLevel: 'industry_standard', // Default for library entries
    dataSource: 'ksb_library',
  };
}

function buildFromBasicFields(ksb: CapabilityComponent): EnhancedKSBInput {
  return {
    id: ksb.id,
    ksbCode: ksb.id,
    title: ksb.itemName,
    description: ksb.itemDescription,
    type: ksb.type,
    proficiencyLevel: ksb.proficiencyLevel || 'L3',
    bloomLevel: ksb.bloomLevel || 'Apply',
    keywords: ksb.keywords || [],
    researchQuality: 50, // Default mid-quality
    citationCount: 0,
    authorityLevel: 'expert_opinion', // Lowest confidence
    dataSource: 'basic_fields',
  };
}

/**
 * Build enhanced input from CapabilityComponent with priority order:
 * ResearchData > ksbLibraryEntry > basic fields
 */
export function buildEnhancedInput(
  ksb: CapabilityComponent,
  ksbLibraryEntry?: KSBLibraryEntry
): EnhancedKSBInput {
  // Priority 1: Use embedded ResearchData
  if (ksb.research && ksb.research.citations && ksb.research.citations.length > 0) {
    return buildFromResearchData(ksb);
  }

  // Priority 2: Use ksbLibraryEntry if provided
  if (ksbLibraryEntry) {
    return buildFromLibraryEntry(ksb, ksbLibraryEntry);
  }

  // Priority 3: Basic fields only
  return buildFromBasicFields(ksb);
}
