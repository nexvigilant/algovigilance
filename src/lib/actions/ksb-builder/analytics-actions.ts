'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import type { CapabilityComponent, KSBContentStatus } from '@/types/pv-curriculum';
import { COLLECTIONS, SUBCOLLECTIONS } from '@/lib/firestore-utils';
import { logger } from '@/lib/logger';
import type { QualityGateResult, GenerationWarning } from './types';
import { calculateResearchQuality } from './helpers';
import {
  type QualityGateThresholds,
  DEFAULT_THRESHOLDS,
  PRODUCTION_THRESHOLDS,
} from '@/app/nucleus/admin/academy/ksb-builder/constants';
import { getKSBsForBuilder, getKSBForBuilder } from './ksb-actions';
import { getKSBFromLibrary } from './library-actions';

// Re-export constants for consumers (avoids re-importing from constants directly)
export { DEFAULT_THRESHOLDS, PRODUCTION_THRESHOLDS };
export type { QualityGateThresholds };

const log = logger.scope('ksb-builder/analytics-actions');

// ============================================================================
// Quality Gates (Phase 3)
// ============================================================================

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
      // No library link — update coverage to reflect this
      await adminDb
        .collection(COLLECTIONS.PV_DOMAINS)
        .doc(domainId)
        .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
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
      .collection(COLLECTIONS.PV_DOMAINS)
      .doc(domainId)
      .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
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
