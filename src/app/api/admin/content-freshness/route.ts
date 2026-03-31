import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAllContent } from '@/lib/intelligence';
import { requireAdmin } from '@/lib/admin-auth';
import type { ContentType } from '@/types/intelligence';
import { toMillisFromSerialized } from '@/types/academy';
import { DURATION_MS } from '@/lib/constants/timing';

import { logger } from '@/lib/logger';
const log = logger.scope('content-freshness/route');

interface FreshnessEntry {
  slug: string;
  title: string;
  contentType: ContentType;
  publishedAt: string;
  daysSincePublished: number;
  lastValidatedAt: string | null;
  daysSinceValidation: number | null;
  healthScore: number | null;
  hasIssues: boolean;
  openIssuesCount: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  priorityScore: number;
}

const DEFAULT_HEALTH_SCORE = 100;
const STALE_VALIDATION_DAYS = 30;
const UNVALIDATED_SENTINEL_DAYS = 999;

const AGE_DAYS = {
  YEAR: 365,
  SIX_MONTHS: 180,
  THREE_MONTHS: 90,
} as const;

const PRIORITY_CUTOFFS = {
  CRITICAL: 60,
  HIGH: 40,
  MEDIUM: 20,
} as const;

/**
 * GET /api/admin/content-freshness
 *
 * Returns a freshness report showing which content needs attention,
 * prioritized by age, validation status, and issue count.
 */
export async function GET() {
  try {
    // Verify admin access
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Authorization gate must pass before any data retrieval
    await requireAdmin();

    // Get all published content
    const allContent = getAllContent();

    // Get all validations from Firestore
    const validationsSnapshot = await adminDb.collection('content_validations').get();
    const validationsMap = new Map<string, {
      completedAtMs: number | null;
      healthScore: number;
      openIssuesCount: number;
      totalIssues: number;
    }>();

    validationsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const completedAt = data.completedAt as Parameters<typeof toMillisFromSerialized>[0] | undefined;
      validationsMap.set(doc.id, {
        completedAtMs: completedAt ? toMillisFromSerialized(completedAt) : null,
        healthScore: data.healthScore || DEFAULT_HEALTH_SCORE,
        openIssuesCount: data.summary?.openIssuesCount || 0,
        totalIssues: data.summary?.totalIssues || 0,
      });
    });

    const now = new Date();
    const freshnessReport: FreshnessEntry[] = [];

    for (const content of allContent) {
      const slug = content.meta.slug;
      const publishedDate = new Date(content.meta.publishedAt);
      const daysSincePublished = Math.floor(
        (now.getTime() - publishedDate.getTime()) / DURATION_MS.day
      );

      const validation = validationsMap.get(slug);
      const lastValidatedAtMs = validation?.completedAtMs ?? null;
      const daysSinceValidation = lastValidatedAtMs
        ? Math.floor((now.getTime() - lastValidatedAtMs) / DURATION_MS.day)
        : null;

      // Calculate priority score (higher = more urgent)
      let priorityScore = 0;

      // Age factor: older content needs more attention
      if (daysSincePublished > AGE_DAYS.YEAR) priorityScore += 30;
      else if (daysSincePublished > AGE_DAYS.SIX_MONTHS) priorityScore += 20;
      else if (daysSincePublished > AGE_DAYS.THREE_MONTHS) priorityScore += 10;

      // Validation recency factor
      if (daysSinceValidation === null) priorityScore += 40; // Never validated
      else if (daysSinceValidation > 30) priorityScore += 25;
      else if (daysSinceValidation > 14) priorityScore += 15;
      else if (daysSinceValidation > 7) priorityScore += 5;

      // Health score factor
      if (validation) {
        if (validation.healthScore < 50) priorityScore += 30;
        else if (validation.healthScore < 70) priorityScore += 20;
        else if (validation.healthScore < 85) priorityScore += 10;
      }

      // Open issues factor
      if (validation) {
        priorityScore += validation.openIssuesCount * 10;
      }

      // Content type factor (publications and perspectives need more accuracy)
      if (content.meta.type === 'publication') priorityScore += 15;
      else if (content.meta.type === 'perspective') priorityScore += 10;
      else if (content.meta.type === 'signal') priorityScore += 5;

      // Determine priority level
      let priority: FreshnessEntry['priority'];
      if (priorityScore >= PRIORITY_CUTOFFS.CRITICAL) priority = 'critical';
      else if (priorityScore >= PRIORITY_CUTOFFS.HIGH) priority = 'high';
      else if (priorityScore >= PRIORITY_CUTOFFS.MEDIUM) priority = 'medium';
      else priority = 'low';

      freshnessReport.push({
        slug,
        title: content.meta.title,
        contentType: content.meta.type,
        publishedAt: content.meta.publishedAt,
        daysSincePublished,
        lastValidatedAt: lastValidatedAtMs ? new Date(lastValidatedAtMs).toISOString() : null,
        daysSinceValidation,
        healthScore: validation?.healthScore ?? null,
        hasIssues: (validation?.totalIssues || 0) > 0,
        openIssuesCount: validation?.openIssuesCount || 0,
        priority,
        priorityScore,
      });
    }

    // Sort by priority score (highest first)
    freshnessReport.sort((a, b) => b.priorityScore - a.priorityScore);

    // Calculate summary stats
    const summary = {
      totalContent: freshnessReport.length,
      neverValidated: freshnessReport.filter((e) => e.lastValidatedAt === null).length,
      staleContent: freshnessReport.filter(
        (e) => (e.daysSinceValidation || UNVALIDATED_SENTINEL_DAYS) > STALE_VALIDATION_DAYS
      ).length,
      criticalPriority: freshnessReport.filter((e) => e.priority === 'critical').length,
      highPriority: freshnessReport.filter((e) => e.priority === 'high').length,
      mediumPriority: freshnessReport.filter((e) => e.priority === 'medium').length,
      lowPriority: freshnessReport.filter((e) => e.priority === 'low').length,
      averageAge: Math.round(
        freshnessReport.reduce((sum, e) => sum + e.daysSincePublished, 0) / freshnessReport.length
      ),
      contentWithIssues: freshnessReport.filter((e) => e.hasIssues).length,
    };

    // Group by content type
    const byContentType = freshnessReport.reduce(
      (acc, entry) => {
        if (!acc[entry.contentType]) {
          acc[entry.contentType] = [];
        }
        acc[entry.contentType].push(entry);
        return acc;
      },
      {} as Record<ContentType, FreshnessEntry[]>
    );

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      summary,
      byPriority: {
        critical: freshnessReport.filter((e) => e.priority === 'critical'),
        high: freshnessReport.filter((e) => e.priority === 'high'),
        medium: freshnessReport.filter((e) => e.priority === 'medium'),
        low: freshnessReport.filter((e) => e.priority === 'low'),
      },
      byContentType,
      all: freshnessReport,
    });
  } catch (error) {
    log.error('[ContentFreshness] Error:', error);
    return NextResponse.json(
      { error: 'Content freshness check failed' },
      { status: 500 }
    );
  }
}
