'use server';

import { getAuthenticatedUser } from '../utils/auth';
import { marketplaceSearchExperts, marketplaceRecommendExperts } from '@/lib/nexcore-api';
import { getTenantContext } from '@/lib/platform/tenant';
import { meterMarketplaceAction } from '@/lib/platform/metering';
import { logger } from '@/lib/logger';

const log = logger.scope('marketplace/actions');

export interface MarketplaceExpert {
  id: string;
  displayName: string;
  title: string;
  expertiseCategories: string[];
  topSkills: string[];
  yearsExperience: number;
  availability: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  matchScore: number;
  matchReasons: string[];
}

export interface MarketplaceSearchResult {
  experts: MarketplaceExpert[];
  total: number;
  query: string;
}

/**
 * Search experts via NexCore matching engine.
 */
export async function searchExperts(
  query: string,
  categories?: string[]
): Promise<{ success: boolean; data?: MarketplaceSearchResult; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const result = await marketplaceSearchExperts(query, categories);
    if (!result) {
      return { success: true, data: { experts: [], total: 0, query } };
    }

    const tenantCtx = await getTenantContext();
    if (tenantCtx) {
      meterMarketplaceAction(tenantCtx.tenantId, user.uid, 'expert_search', { query });
    }

    const experts: MarketplaceExpert[] = result.experts.map((e) => ({
      id: e.id,
      displayName: e.display_name,
      title: e.title,
      expertiseCategories: e.expertise_categories,
      topSkills: e.top_skills,
      yearsExperience: e.years_experience,
      availability: e.availability,
      rating: e.rating,
      reviewCount: e.review_count,
      verified: e.verified,
      matchScore: e.match_score,
      matchReasons: e.match_reasons,
    }));

    return { success: true, data: { experts, total: result.total, query } };
  } catch (error) {
    log.error('Expert search failed', { error });
    return { success: false, error: 'Search failed' };
  }
}

/**
 * Get recommended experts for the current tenant.
 */
export async function getRecommendedExperts(): Promise<{
  success: boolean;
  data?: MarketplaceSearchResult;
  error?: string;
}> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const tenantCtx = await getTenantContext();
    const tenantId = tenantCtx?.tenantId || 'default';

    const result = await marketplaceRecommendExperts(tenantId);
    if (!result) {
      return { success: true, data: { experts: [], total: 0, query: 'recommendations' } };
    }

    const experts: MarketplaceExpert[] = result.experts.map((e) => ({
      id: e.id,
      displayName: e.display_name,
      title: e.title,
      expertiseCategories: e.expertise_categories,
      topSkills: e.top_skills,
      yearsExperience: e.years_experience,
      availability: e.availability,
      rating: e.rating,
      reviewCount: e.review_count,
      verified: e.verified,
      matchScore: e.match_score,
      matchReasons: e.match_reasons,
    }));

    return { success: true, data: { experts, total: result.total, query: 'recommendations' } };
  } catch (error) {
    log.error('Recommendations fetch failed', { error });
    return { success: false, error: 'Failed to load recommendations' };
  }
}
