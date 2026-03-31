'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { COLLECTIONS, SUBCOLLECTIONS } from '@/lib/firestore-utils';
import { logger } from '@/lib/logger';
import {
  generateFullALOContent,
  type ALOGenerationInput,
  type ALOContent,
} from '@/lib/ai/flows/generate-alo-content';
import {
  DEFAULT_THRESHOLDS,
  PRODUCTION_THRESHOLDS,
} from '@/app/nucleus/admin/academy/ksb-builder/constants';
import type { QualityGateResult } from './types';
import { buildEnhancedInput } from './helpers';
import type { KSBLibraryEntry } from './types';
import { validateQualityGates } from './analytics-actions';
import { getKSBForBuilder, updateKSBStatus } from './ksb-actions';
import { getKSBFromLibrary } from './library-actions';

const log = logger.scope('ksb-builder/generation-actions');

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
      adminDb.collection(COLLECTIONS.PV_DOMAINS).doc(domainId).get(),
      ksb.ksbLibraryId ? getKSBFromLibrary(ksb.ksbLibraryId) : Promise.resolve(null),
    ]);
    const domainName = domainDoc.data()?.name || `Domain ${domainId}`;

    // Build enhanced input with priority: ResearchData > ksbLibrary > basic
    const ksbLibraryEntry: KSBLibraryEntry | undefined =
      libraryResult?.success && libraryResult.entry ? libraryResult.entry : undefined;

    const enhancedInput = buildEnhancedInput(ksb, ksbLibraryEntry);

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
        .collection(COLLECTIONS.PV_DOMAINS)
        .doc(domainId)
        .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
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
        .collection(COLLECTIONS.PV_DOMAINS)
        .doc(domainId)
        .collection(SUBCOLLECTIONS.CAPABILITY_COMPONENTS)
        .doc(ksbId)
        .update({
          status: 'draft',
          updatedAt: adminTimestamp.now(),
        });
    } catch (revertError) {
      // Log but don't throw — main error is already being returned
      log.warn('[ksb-builder] Failed to revert status to draft after content generation failure:', revertError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate content',
    };
  }
}
