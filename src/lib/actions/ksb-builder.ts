'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import type {
  CapabilityComponent,
  KSBHook,
  KSBConcept,
  KSBActivity,
  KSBReflection,
  KSBActivityMetadata,
  KSBContentStatus,
  KSBStatusChange,
  AuthorityLevel,
  ResearchData,
  CoverageScore,
} from '@/types/pv-curriculum';
import {
  generateFullALOContent,
  type ALOGenerationInput,
  type ALOContent,
} from '@/lib/ai/flows/generate-alo-content';
import {
  type QualityGateThresholds,
  DEFAULT_THRESHOLDS,
  PRODUCTION_THRESHOLDS,
} from '@/app/nucleus/admin/academy/ksb-builder/constants';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('ksb-builder/actions');

// Helper to serialize Firestore Timestamps recursively for Client Components
function serializeTimestamps<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  // Check if it's a Firestore Timestamp (has toDate method or _seconds/_nanoseconds)
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

    // Regular object - recurse
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeTimestamps(value);
    }
    return result as T;
  }

  return obj;
}

// ============================================================================
// KSB Library Types (Universal Knowledge Bank)
// ============================================================================

export interface KSBLibraryEntry {
  id: string;
  ksbCode: string;
  title: string;
  description: string;
  type: 'knowledge' | 'skill' | 'behavior';
  keywords: string[];
  researchQuality: number;
  lastUpdated: Date;
  citations?: number;
}

// ============================================================================
// Enhanced KSB Input (Priority: ResearchData > ksbLibrary > basic)
// ============================================================================

export interface EnhancedCitation {
  type: string;
  title: string;
  source: string;
  identifier?: string;
  section?: string;
  relevanceScore: number;
  notes?: string;
}

export interface EnhancedKSBInput {
  // Basic identification
  id: string;
  ksbCode: string;
  title: string;
  description: string;
  type: 'knowledge' | 'skill' | 'behavior' | 'ai_integration';

  // Learning context
  proficiencyLevel: string;
  bloomLevel: string;
  keywords: string[];

  // Research quality indicators
  researchQuality: number;
  citationCount: number;
  authorityLevel: AuthorityLevel;

  // Rich context for AI
  citations?: EnhancedCitation[];
  regulatoryContext?: {
    primaryRegion: string;
    guidelines: string[];
    regionalVariations?: string[];
  };

  // Coverage indicators
  coverageAreas?: {
    definition: boolean;
    regulations: boolean;
    bestPractices: boolean;
    examples: boolean;
    assessmentCriteria: boolean;
  };

  // Data source indicator
  dataSource: 'research_data' | 'ksb_library' | 'basic_fields';
}

export interface GenerationWarning {
  severity: 'info' | 'warning' | 'error';
  message: string;
}

// ============================================================================
// Quality Gates (Phase 3)
// ============================================================================

export interface QualityGateResult {
  passed: boolean;
  blockers: string[];
  warnings: string[];
  score: number;
}

// QualityGateThresholds, DEFAULT_THRESHOLDS, and PRODUCTION_THRESHOLDS
// are imported from ./constants to avoid 'use server' export restrictions

/**
 * Validate KSB against quality gates before generation
 */
export async function validateQualityGates(
  ksb: CapabilityComponent,
  thresholds: QualityGateThresholds = DEFAULT_THRESHOLDS
): Promise<QualityGateResult> {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Check coverage score
  const coverageScore = ksb.coverageScore?.overall || 0;
  if (coverageScore < thresholds.minCoverageScore) {
    blockers.push(`Coverage score (${coverageScore}%) below minimum (${thresholds.minCoverageScore}%)`);
  } else {
    score += 25;
  }

  // Check citation count
  const citationCount = ksb.research?.citations?.length || 0;
  if (citationCount < thresholds.minCitationCount) {
    if (thresholds.minCitationCount > 0) {
      blockers.push(`Citation count (${citationCount}) below minimum (${thresholds.minCitationCount})`);
    }
  } else {
    score += 25;
  }

  // Check for regulatory sources
  if (thresholds.requireRegulatorySource) {
    const hasRegulatorySource = ksb.research?.primarySourceCount && ksb.research.primarySourceCount > 0;
    if (!hasRegulatorySource) {
      blockers.push('No regulatory sources found (required for production content)');
    } else {
      score += 25;
    }
  } else {
    score += 25;
  }

  // Check research quality
  const researchQuality = ksb.research ? calculateResearchQuality(ksb.research) : 50;
  if (researchQuality < thresholds.minResearchQuality) {
    if (thresholds.minResearchQuality > 50) {
      blockers.push(`Research quality (${researchQuality}%) below minimum (${thresholds.minResearchQuality}%)`);
    } else {
      warnings.push(`Low research quality (${researchQuality}%)`);
    }
  } else {
    score += 25;
  }

  // Check for stale research
  if (ksb.research?.lastResearchedAt) {
    const lastResearched = ksb.research.lastResearchedAt instanceof Date
      ? ksb.research.lastResearchedAt
      : new Date(ksb.research.lastResearchedAt);
    const daysSince = Math.floor((Date.now() - lastResearched.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince > thresholds.maxStaleDays) {
      warnings.push(`Research is stale (${daysSince} days old, max: ${thresholds.maxStaleDays})`);
      score -= 10;
    }
  }

  // Check for coverage blockers
  if (ksb.coverageScore?.blockers && ksb.coverageScore.blockers.length > 0) {
    const criticalBlockers = ksb.coverageScore.blockers.filter(b => b.severity === 'critical');
    if (criticalBlockers.length > 0) {
      blockers.push(`Critical blockers: ${criticalBlockers.map(b => b.description).join('; ')}`);
    }
  }

  return {
    passed: blockers.length === 0,
    blockers,
    warnings,
    score: Math.max(0, Math.min(100, score)),
  };
}

// ============================================================================
// Helper Functions for Enhanced Input
// ============================================================================

/**
 * Calculate generation warnings based on KSB data quality
 */
export async function getGenerationWarnings(ksb: CapabilityComponent): Promise<GenerationWarning[]> {
  const warnings: GenerationWarning[] = [];

  // Check for research data
  if (!ksb.research && !ksb.ksbLibraryId) {
    warnings.push({
      severity: 'warning',
      message: 'No research data available. Generation will use basic description only.',
    });
  }

  // Check citation count
  if (ksb.research) {
    const sourceCount = ksb.research.sourceCount || ksb.research.citations?.length || 0;
    if (sourceCount === 0) {
      warnings.push({
        severity: 'warning',
        message: 'No citations found. Consider adding research sources.',
      });
    } else if (sourceCount < 3) {
      warnings.push({
        severity: 'info',
        message: `Limited sources (${sourceCount}). Consider adding more research.`,
      });
    }

    // Check for regulatory sources
    if ((ksb.research.primarySourceCount || 0) === 0) {
      warnings.push({
        severity: 'info',
        message: 'No regulatory sources. Content may lack authoritative backing.',
      });
    }

    // Check coverage areas
    if (ksb.research.coverageAreas) {
      const { definition, regulations, bestPractices, examples, assessmentCriteria } = ksb.research.coverageAreas;
      const missing: string[] = [];
      if (!definition) missing.push('definition');
      if (!regulations) missing.push('regulations');
      if (!bestPractices) missing.push('best practices');
      if (!examples) missing.push('examples');
      if (!assessmentCriteria) missing.push('assessment criteria');

      if (missing.length > 0) {
        warnings.push({
          severity: 'info',
          message: `Missing coverage: ${missing.join(', ')}.`,
        });
      }
    }

    // Check for stale research
    if (ksb.research.lastResearchedAt) {
      const lastResearched = ksb.research.lastResearchedAt instanceof Date
        ? ksb.research.lastResearchedAt
        : new Date(ksb.research.lastResearchedAt);
      const daysSince = Math.floor((Date.now() - lastResearched.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 365) {
        warnings.push({
          severity: 'warning',
          message: `Research may be outdated (${daysSince} days old).`,
        });
      }
    }
  }

  // Check coverage score
  if (ksb.coverageScore) {
    if (ksb.coverageScore.overall < 40) {
      warnings.push({
        severity: 'warning',
        message: `Low coverage score (${ksb.coverageScore.overall}%). Consider improving research.`,
      });
    }

    // Surface blockers
    if (ksb.coverageScore.blockers && ksb.coverageScore.blockers.length > 0) {
      const blockerMessages = ksb.coverageScore.blockers.map(b => b.description).join('; ');
      warnings.push({
        severity: 'info',
        message: `Blockers: ${blockerMessages}`,
      });
    }
  }

  return warnings;
}

/**
 * Build enhanced input from CapabilityComponent with priority order
 */
export async function buildEnhancedInput(
  ksb: CapabilityComponent,
  ksbLibraryEntry?: KSBLibraryEntry
): Promise<EnhancedKSBInput> {
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

function calculateResearchQuality(research: ResearchData): number {
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
// Functional Area Types
// ============================================================================

export interface FunctionalAreaInfo {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'coming_soon' | 'archived';
  domainCount?: number;
}

// ============================================================================
// Domain Types
// ============================================================================

export interface DomainInfo {
  id: string;
  name: string;
  cluster?: string;
  description?: string;
  functionalAreaId?: string;
}

// ============================================================================
// Fetch Functional Areas
// ============================================================================

export async function getFunctionalAreas(): Promise<{
  success: boolean;
  functionalAreas?: FunctionalAreaInfo[];
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection('functional_areas')
      .orderBy('name', 'asc')
      .get();

    const functionalAreas: FunctionalAreaInfo[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id,
        description: data.description,
        status: data.status || 'active',
        domainCount: data.domainCount || 0,
      };
    });

    return { success: true, functionalAreas };
  } catch (error) {
    log.error('Error fetching functional areas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch functional areas',
    };
  }
}

// ============================================================================
// Fetch Domains
// ============================================================================

export async function getDomains(functionalAreaId?: string): Promise<{
  success: boolean;
  domains?: DomainInfo[];
  error?: string;
}> {
  try {
    // Use simple query without orderBy to avoid composite index requirement
    let snapshot;

    if (functionalAreaId) {
      snapshot = await adminDb
        .collection('pv_domains')
        .where('functionalAreaId', '==', functionalAreaId)
        .get();
    } else {
      snapshot = await adminDb.collection('pv_domains').get();
    }

    const domains: DomainInfo[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Domain ${doc.id}`,
        cluster: data.cluster,
        description: data.description,
        functionalAreaId: data.functionalAreaId,
      };
    });

    // Sort in-memory by id
    domains.sort((a, b) => a.id.localeCompare(b.id));

    return { success: true, domains };
  } catch (error) {
    log.error('Error fetching domains:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch domains',
    };
  }
}

// ============================================================================
// Fetch KSBs for Builder
// ============================================================================

export async function getKSBsForBuilder(
  domainId: string
): Promise<{ success: boolean; ksbs?: CapabilityComponent[]; error?: string }> {
  try {
    const snapshot = await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .orderBy('id', 'asc')
      .get();

    const ksbs: CapabilityComponent[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Serialize all timestamps recursively for Client Component compatibility
      return serializeTimestamps(data) as CapabilityComponent;
    });

    return { success: true, ksbs };
  } catch (error) {
    log.error('Error fetching KSBs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch KSBs',
    };
  }
}

export async function getKSBForBuilder(
  domainId: string,
  ksbId: string
): Promise<{ success: boolean; ksb?: CapabilityComponent; error?: string }> {
  try {
    const docSnap = await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .get();

    if (!docSnap.exists) {
      return { success: false, error: 'KSB not found' };
    }

    const data = docSnap.data();
    if (!data) {
      return { success: false, error: 'KSB data is empty' };
    }
    // Serialize all timestamps recursively for Client Component compatibility
    const ksb: CapabilityComponent = serializeTimestamps(data) as CapabilityComponent;

    return { success: true, ksb };
  } catch (error) {
    log.error('Error fetching KSB:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch KSB',
    };
  }
}

// ============================================================================
// Update KSB Activity Content
// ============================================================================

export async function updateKSBHook(
  domainId: string,
  ksbId: string,
  hook: KSBHook
): Promise<{ success: boolean; error?: string }> {
  try {
    // Require admin access for KSB updates
    await requireAdmin();

    await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .update({
        hook,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating hook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update hook',
    };
  }
}

export async function updateKSBConcept(
  domainId: string,
  ksbId: string,
  concept: KSBConcept
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .update({
        concept,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating concept:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update concept',
    };
  }
}

export async function updateKSBActivity(
  domainId: string,
  ksbId: string,
  activity: KSBActivity
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .update({
        activity,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating activity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update activity',
    };
  }
}

export async function updateKSBReflection(
  domainId: string,
  ksbId: string,
  reflection: KSBReflection
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .update({
        reflection,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating reflection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reflection',
    };
  }
}

export async function updateKSBMetadata(
  domainId: string,
  ksbId: string,
  metadata: KSBActivityMetadata
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .update({
        activityMetadata: metadata,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update metadata',
    };
  }
}

export async function updateKSBFullContent(
  domainId: string,
  ksbId: string,
  content: {
    hook?: KSBHook;
    concept?: KSBConcept;
    activity?: KSBActivity;
    reflection?: KSBReflection;
    activityMetadata?: KSBActivityMetadata;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .update({
        ...content,
        updatedAt: adminTimestamp.now(),
      });
    return { success: true };
  } catch (error) {
    log.error('Error updating KSB content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content',
    };
  }
}

// ============================================================================
// Get KSB Content Status
// ============================================================================

export async function getKSBContentStatus(
  domainId: string
): Promise<{
  success: boolean;
  stats?: {
    total: number;
    withHook: number;
    withConcept: number;
    withActivity: number;
    withReflection: number;
    complete: number;
  };
  error?: string;
}> {
  try {
    const result = await getKSBsForBuilder(domainId);
    if (!result.success || !result.ksbs) {
      return { success: false, error: result.error };
    }

    const ksbs = result.ksbs;
    const stats = {
      total: ksbs.length,
      withHook: ksbs.filter((k) => k.hook).length,
      withConcept: ksbs.filter((k) => k.concept).length,
      withActivity: ksbs.filter((k) => k.activity).length,
      withReflection: ksbs.filter((k) => k.reflection).length,
      complete: ksbs.filter((k) => k.hook && k.concept && k.activity && k.reflection).length,
    };

    return { success: true, stats };
  } catch (error) {
    log.error('Error getting content status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status',
    };
  }
}

// ============================================================================
// KSB Library Integration (Universal Knowledge Bank)
// ============================================================================
//
// NOTE: The `ksb_library` collection is INTENTIONALLY used here.
// Unlike the legacy ksb-management/actions.ts, this is NOT deprecated.
//
// The ksb_library serves as a "Universal Knowledge Bank" for AI content generation:
// - Provides rich research data for ALO content generation
// - Contains citation and regulatory context for enhanced prompts
// - Links to capability_components via `ksbLibraryId` field
//
// Primary KSB data storage: pv_domains/{id}/capability_components
// Research enrichment: ksb_library (linked via ksbLibraryId)
// ============================================================================

export async function searchKSBLibrary(
  query: string,
  type?: 'knowledge' | 'skill' | 'behavior'
): Promise<{ success: boolean; entries?: KSBLibraryEntry[]; error?: string }> {
  try {
    let queryRef = adminDb.collection('ksb_library').limit(50);

    if (type) {
      queryRef = queryRef.where('type', '==', type);
    }

    const snapshot = await queryRef.get();

    // Filter by query string (title, description, keywords)
    const entries: KSBLibraryEntry[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ksbCode: data.ksbCode || data.id,
          title: data.title || data.itemName || '',
          description: data.description || data.itemDescription || '',
          type: data.type || 'knowledge',
          keywords: data.keywords || [],
          researchQuality: data.researchQuality || data.qualityScore || 0,
          lastUpdated: toDateFromSerialized(data.lastUpdated) || toDateFromSerialized(data.updatedAt),
          citations: data.citations || data.citationCount || 0,
        } as KSBLibraryEntry;
      })
      .filter((entry) => {
        const searchLower = query.toLowerCase();
        return (
          entry.title.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower) ||
          entry.keywords.some((k) => k.toLowerCase().includes(searchLower))
        );
      });

    return { success: true, entries };
  } catch (error) {
    log.error('Error searching KSB library:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search library',
    };
  }
}

export async function getKSBFromLibrary(
  ksbLibraryId: string
): Promise<{ success: boolean; entry?: KSBLibraryEntry; error?: string }> {
  try {
    const docSnap = await adminDb.collection('ksb_library').doc(ksbLibraryId).get();

    if (!docSnap.exists) {
      return { success: false, error: 'KSB not found in library' };
    }

    const data = docSnap.data();
    if (!data) {
      return { success: false, error: 'KSB library data is empty' };
    }
    const entry: KSBLibraryEntry = {
      id: docSnap.id,
      ksbCode: data.ksbCode || data.id,
      title: data.title || data.itemName || '',
      description: data.description || data.itemDescription || '',
      type: data.type || 'knowledge',
      keywords: data.keywords || [],
      researchQuality: data.researchQuality || data.qualityScore || 0,
      lastUpdated: toDateFromSerialized(data.lastUpdated) || toDateFromSerialized(data.updatedAt),
      citations: data.citations || data.citationCount || 0,
    };

    return { success: true, entry };
  } catch (error) {
    log.error('Error fetching from KSB library:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch from library',
    };
  }
}

export async function linkKSBToLibrary(
  domainId: string,
  ksbId: string,
  ksbLibraryId: string,
  matchConfidence: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // Verify the library entry exists
    const libraryEntry = await getKSBFromLibrary(ksbLibraryId);
    if (!libraryEntry.success || !libraryEntry.entry) {
      return { success: false, error: 'KSB library entry not found' };
    }

    const entry = libraryEntry.entry;

    // Update the capability component with the reference
    await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .update({
        ksbLibraryId,
        ksbLibraryMapping: {
          matchConfidence,
          mappedAt: adminTimestamp.now(),
          mappedBy: userId,
        },
        coverage: {
          hasResearch: true,
          researchQuality: entry.researchQuality,
          lastSynced: adminTimestamp.now(),
          readyForProduction: entry.researchQuality >= 70,
          missingRequirements: entry.researchQuality < 70
            ? ['Research quality below threshold']
            : [],
        },
        updatedAt: adminTimestamp.now(),
      });

    return { success: true };
  } catch (error) {
    log.error('Error linking KSB to library:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to link KSB',
    };
  }
}

// ============================================================================
// Workflow Status Management
// ============================================================================

export async function updateKSBStatus(
  domainId: string,
  ksbId: string,
  newStatus: KSBContentStatus,
  userId: string,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // Get current status for audit
    const ksbResult = await getKSBForBuilder(domainId, ksbId);
    if (!ksbResult.success || !ksbResult.ksb) {
      return { success: false, error: 'KSB not found' };
    }

    const previousStatus = ksbResult.ksb.status || 'draft';

    // Validate status transition
    const validTransitions: Record<KSBContentStatus, KSBContentStatus[]> = {
      draft: ['generating'],
      generating: ['review', 'draft'],
      review: ['published', 'draft'],
      published: ['archived', 'review'],
      archived: ['draft'],
    };

    if (!validTransitions[previousStatus]?.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status transition: ${previousStatus} → ${newStatus}`,
      };
    }

    // Build workflow update based on new status
    const workflowUpdate: Record<string, unknown> = {
      version: (ksbResult.ksb.workflow?.version || 0) + 1,
      lastModifiedBy: userId,
    };

    if (newStatus === 'review') {
      workflowUpdate.generatedAt = adminTimestamp.now();
    } else if (newStatus === 'published') {
      workflowUpdate.reviewedBy = userId;
      workflowUpdate.reviewedAt = adminTimestamp.now();
      workflowUpdate.publishedBy = userId;
      workflowUpdate.publishedAt = adminTimestamp.now();
      if (comment) workflowUpdate.reviewNotes = comment;
    } else if (newStatus === 'archived') {
      workflowUpdate.archivedBy = userId;
      workflowUpdate.archivedAt = adminTimestamp.now();
    }

    // Update KSB status and create audit record in parallel (independent writes)
    const statusChange: Omit<KSBStatusChange, 'id'> = {
      ksbId,
      domainId,
      previousStatus,
      newStatus,
      changedBy: userId,
      changedAt: new Date(),
      comment,
    };

    await Promise.all([
      adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components')
        .doc(ksbId)
        .update({
          status: newStatus,
          workflow: workflowUpdate,
          updatedAt: adminTimestamp.now(),
        }),
      adminDb.collection('ksb_status_changes').add(statusChange),
    ]);

    return { success: true };
  } catch (error) {
    log.error('Error updating KSB status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

export async function submitForReview(
  domainId: string,
  ksbId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Validate content completeness before submitting
  const ksbResult = await getKSBForBuilder(domainId, ksbId);
  if (!ksbResult.success || !ksbResult.ksb) {
    return { success: false, error: 'KSB not found' };
  }

  const ksb = ksbResult.ksb;
  const missingContent: string[] = [];

  if (!ksb.hook?.content) missingContent.push('Hook');
  if (!ksb.concept?.content) missingContent.push('Concept');
  if (!ksb.activity?.instructions) missingContent.push('Activity');
  if (!ksb.reflection?.prompt) missingContent.push('Reflection');

  if (missingContent.length > 0) {
    return {
      success: false,
      error: `Missing required content: ${missingContent.join(', ')}`,
    };
  }

  return updateKSBStatus(domainId, ksbId, 'review', userId);
}

export async function publishKSB(
  domainId: string,
  ksbId: string,
  userId: string,
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  return updateKSBStatus(domainId, ksbId, 'published', userId, reviewNotes);
}

export async function archiveKSB(
  domainId: string,
  ksbId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  return updateKSBStatus(domainId, ksbId, 'archived', userId, reason);
}

// ============================================================================
// Coverage Sync and Stats
// ============================================================================

export async function syncKSBCoverage(
  domainId: string,
  ksbId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const ksbResult = await getKSBForBuilder(domainId, ksbId);
    if (!ksbResult.success || !ksbResult.ksb) {
      return { success: false, error: 'KSB not found' };
    }

    const ksb = ksbResult.ksb;

    if (!ksb.ksbLibraryId) {
      // No library link - update coverage to reflect this
      await adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components')
        .doc(ksbId)
        .update({
          coverage: {
            hasResearch: false,
            lastSynced: adminTimestamp.now(),
            readyForProduction: false,
            missingRequirements: ['Not linked to KSB library'],
          },
          updatedAt: adminTimestamp.now(),
        });
      return { success: true };
    }

    // Fetch latest from library
    const libraryResult = await getKSBFromLibrary(ksb.ksbLibraryId);
    if (!libraryResult.success || !libraryResult.entry) {
      return { success: false, error: 'Library entry not found' };
    }

    const entry = libraryResult.entry;
    const missingRequirements: string[] = [];

    if (entry.researchQuality < 70) {
      missingRequirements.push('Research quality below 70%');
    }
    if (!entry.citations || entry.citations < 5) {
      missingRequirements.push('Insufficient citations');
    }

    await adminDb
      .collection('pv_domains')
      .doc(domainId)
      .collection('capability_components')
      .doc(ksbId)
      .update({
        coverage: {
          hasResearch: true,
          researchQuality: entry.researchQuality,
          lastSynced: adminTimestamp.now(),
          readyForProduction: missingRequirements.length === 0,
          missingRequirements,
        },
        updatedAt: adminTimestamp.now(),
      });

    return { success: true };
  } catch (error) {
    log.error('Error syncing coverage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync coverage',
    };
  }
}

export async function getDomainWorkflowStats(
  domainId: string
): Promise<{
  success: boolean;
  stats?: {
    total: number;
    byStatus: Record<KSBContentStatus, number>;
    readyForProduction: number;
    linkedToLibrary: number;
  };
  error?: string;
}> {
  try {
    const result = await getKSBsForBuilder(domainId);
    if (!result.success || !result.ksbs) {
      return { success: false, error: result.error };
    }

    const ksbs = result.ksbs;
    const byStatus: Record<KSBContentStatus, number> = {
      draft: 0,
      generating: 0,
      review: 0,
      published: 0,
      archived: 0,
    };

    ksbs.forEach((ksb) => {
      const status = ksb.status || 'draft';
      byStatus[status]++;
    });

    const stats = {
      total: ksbs.length,
      byStatus,
      readyForProduction: ksbs.filter((k) => k.coverage?.readyForProduction).length,
      linkedToLibrary: ksbs.filter((k) => k.ksbLibraryId).length,
    };

    return { success: true, stats };
  } catch (error) {
    log.error('Error getting workflow stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
}

// ============================================================================
// AI Content Generation
// ============================================================================

export async function generateALOContent(
  domainId: string,
  ksbId: string,
  activityEngineType: 'red_pen' | 'triage' | 'synthesis',
  userId: string,
  options?: {
    bypassQualityGates?: boolean;
    useProductionThresholds?: boolean;
  }
): Promise<{
  success: boolean;
  content?: ALOContent;
  error?: string;
  qualityGate?: QualityGateResult;
}> {
  try {
    await requireAdmin();

    // Get the KSB from pv_domains
    const ksbResult = await getKSBForBuilder(domainId, ksbId);
    if (!ksbResult.success || !ksbResult.ksb) {
      return { success: false, error: 'KSB not found' };
    }

    const ksb = ksbResult.ksb;

    // Quality gate validation (Phase 3)
    if (!options?.bypassQualityGates) {
      const thresholds = options?.useProductionThresholds ? PRODUCTION_THRESHOLDS : DEFAULT_THRESHOLDS;
      const qualityGate = await validateQualityGates(ksb, thresholds);

      if (!qualityGate.passed) {
        return {
          success: false,
          error: `Quality gate failed: ${qualityGate.blockers.join('; ')}`,
          qualityGate,
        };
      }

      // Log warnings but continue
      if (qualityGate.warnings.length > 0) {
        log.warn(`Quality gate warnings for ${ksbId}:`, qualityGate.warnings);
      }
    }

    // Fetch domain name and (optionally) KSB library entry in parallel
    const [domainDoc, libraryResult] = await Promise.all([
      adminDb.collection('pv_domains').doc(domainId).get(),
      ksb.ksbLibraryId ? getKSBFromLibrary(ksb.ksbLibraryId) : Promise.resolve(null),
    ]);
    const domainName = domainDoc.data()?.name || `Domain ${domainId}`;

    // Build enhanced input with priority: ResearchData > ksbLibrary > basic
    const ksbLibraryEntry: KSBLibraryEntry | undefined =
      libraryResult?.success && libraryResult.entry ? libraryResult.entry : undefined;

    const enhancedInput = await buildEnhancedInput(ksb, ksbLibraryEntry);

    // Log data source for debugging
    log.debug(`Generating ALO for ${ksbId} using ${enhancedInput.dataSource} data source`);
    if (enhancedInput.dataSource === 'research_data') {
      log.debug(`  - Citations: ${enhancedInput.citationCount}`);
      log.debug(`  - Authority: ${enhancedInput.authorityLevel}`);
      log.debug(`  - Quality: ${enhancedInput.researchQuality}%`);
    }

    // Update status to generating
    await updateKSBStatus(domainId, ksbId, 'generating', userId);

    // Build generation input (convert enhanced to legacy format for now)
    // TODO: Update Genkit flow to accept EnhancedKSBInput directly
    const ksbEntry: KSBLibraryEntry = {
      id: enhancedInput.id,
      ksbCode: enhancedInput.ksbCode,
      title: enhancedInput.title,
      description: enhancedInput.description,
      type: enhancedInput.type === 'ai_integration' ? 'knowledge' : enhancedInput.type,
      keywords: enhancedInput.keywords,
      researchQuality: enhancedInput.researchQuality,
      lastUpdated: new Date(),
      citations: enhancedInput.citationCount,
    };

    const input: ALOGenerationInput = {
      ksbEntry,
      domainId,
      domainName,
      ksbType: ksb.type,
      proficiencyLevel: enhancedInput.proficiencyLevel,
      bloomLevel: enhancedInput.bloomLevel,
      activityEngineType,
      // Pass enhanced context for richer generation (Phase 2)
      enhancedContext: {
        citations: enhancedInput.citations,
        authorityLevel: enhancedInput.authorityLevel,
        regulatoryContext: enhancedInput.regulatoryContext,
        coverageAreas: enhancedInput.coverageAreas,
        dataSource: enhancedInput.dataSource,
      },
      // Legacy contextualInfo for backward compatibility
      contextualInfo: enhancedInput.citations
        ? `Sources: ${enhancedInput.citations.map(c => c.identifier || c.title).join(', ')}. ` +
          (enhancedInput.regulatoryContext?.guidelines?.length
            ? `Guidelines: ${enhancedInput.regulatoryContext.guidelines.join(', ')}.`
            : '')
        : undefined,
    };

    // Generate content
    const content = await generateFullALOContent(input);

    // Save generated content and create audit record in parallel (independent writes)
    await Promise.all([
      adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components')
        .doc(ksbId)
        .update({
          hook: content.hook,
          concept: content.concept,
          activity: content.activity,
          reflection: content.reflection,
          activityMetadata: content.activityMetadata,
          status: 'review',
          workflow: {
            version: (ksb.workflow?.version || 0) + 1,
            lastModifiedBy: userId,
            generatedAt: adminTimestamp.now(),
          },
          // Track generation metadata
          generation: {
            model: 'gemini-2.5-flash',
            promptVersion: '1.0',
            researchDataUsed: enhancedInput.dataSource === 'research_data',
            generatedAt: new Date(),
            regenerationCount: (ksb.generation?.regenerationCount || 0) + 1,
            sourceDocuments: enhancedInput.citations?.map(c => c.identifier || c.title) || [],
          },
          updatedAt: adminTimestamp.now(),
        }),
      adminDb.collection('ksb_status_changes').add({
        ksbId,
        domainId,
        previousStatus: 'generating',
        newStatus: 'review',
        changedBy: userId,
        changedAt: new Date(),
        comment: `AI generated ${activityEngineType} activity`,
      }),
    ]);

    return { success: true, content };
  } catch (error) {
    log.error('Error generating ALO content:', error);

    // Attempt to revert status to draft on failure
    try {
      await adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components')
        .doc(ksbId)
        .update({
          status: 'draft',
          updatedAt: adminTimestamp.now(),
        });
    } catch (revertError) {
      // Log but don't throw - main error is already being returned
      log.warn('[ksb-builder] Failed to revert status to draft after content generation failure:', revertError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate content',
    };
  }
}

// ============================================================================
// Update KSB Research Data (with auto CoverageScore calculation)
// ============================================================================

/**
 * Calculate CoverageScore from ResearchData
 */
function calculateCoverageScoreFromResearch(research: Partial<ResearchData>): CoverageScore {
  // Calculate component scores
  const definitionScore = research.coverageAreas?.definition ? 100 : 0;
  const regulationsScore = research.coverageAreas?.regulations ? 100 : 0;
  const bestPracticesScore = research.coverageAreas?.bestPractices ? 100 : 0;
  const examplesScore = research.coverageAreas?.examples ? 100 : 0;
  const assessmentScore = research.coverageAreas?.assessmentCriteria ? 100 : 0;

  // Context score based on citations
  const contextScore = Math.min((research.sourceCount || 0) * 25, 100);

  // Common errors - derive from authority level
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

/**
 * Update research data for a KSB with auto CoverageScore recalculation
 */
export async function updateKSBResearch(
  domainId: string,
  ksbId: string,
  researchData: Partial<ResearchData>,
  userId: string
): Promise<{ success: boolean; error?: string; coverageScore?: CoverageScore }> {
  try {
    await requireAdmin();

    // Calculate new coverage score
    const coverageScore = calculateCoverageScoreFromResearch(researchData);

    // Update the KSB document and create audit record in parallel (independent writes)
    await Promise.all([
      adminDb
        .collection('pv_domains')
        .doc(domainId)
        .collection('capability_components')
        .doc(ksbId)
        .update({
          research: {
            ...researchData,
            lastResearchedAt: new Date(),
            researchedBy: userId,
          },
          coverageScore,
          updatedAt: adminTimestamp.now(),
        }),
      adminDb.collection('ksb_research_updates').add({
        ksbId,
        domainId,
        updatedBy: userId,
        updatedAt: new Date(),
        citationCount: researchData.citations?.length || 0,
        authorityLevel: researchData.authorityLevel,
        coverageScore: coverageScore.overall,
      }),
    ]);

    return { success: true, coverageScore };
  } catch (error) {
    log.error('Error updating KSB research:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update research data',
    };
  }
}

/**
 * Alias for backwards compatibility
 */
export async function getKSBsForDomain(domainId: string) {
  return getKSBsForBuilder(domainId);
}
