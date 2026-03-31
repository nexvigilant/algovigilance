'use server';

import { getAuthenticatedUser } from '../utils/auth';
import { benchmarkGet, benchmarkPlatformAggregates } from '@/lib/nexcore-api';
import { getTenantContext } from '@/lib/platform/tenant';
import { meterCommunityAction } from '@/lib/platform/metering';
import { logger } from '@/lib/logger';

const log = logger.scope('benchmarks/actions');

export interface BenchmarkDataPoint {
  dimension: string;
  value: number;
  percentile: number;
  platformMedian: number;
  platformP25: number;
  platformP75: number;
  sampleSize: number;
  period: string;
}

export interface BenchmarkReport {
  tenantId: string;
  period: string;
  dataPoints: BenchmarkDataPoint[];
  overallScore: number;
  overallPercentile: number;
  insights: string[];
  recommendations: string[];
}

export interface PlatformAggregates {
  period: string;
  totalTenants: number;
  dimensions: Array<{
    dimension: string;
    median: number;
    p25: number;
    p75: number;
    sampleSize: number;
  }>;
}

/**
 * Get benchmark report for the current tenant.
 */
export async function getTenantBenchmarks(
  period?: string
): Promise<{ success: boolean; data?: BenchmarkReport; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const tenantCtx = await getTenantContext();
    const tenantId = tenantCtx?.tenantId || 'default';

    const result = await benchmarkGet(tenantId, period);
    if (!result) {
      return { success: false, error: 'Benchmark service unavailable' };
    }

    if (tenantCtx) {
      meterCommunityAction(tenantCtx.tenantId, user.uid, 'benchmark_viewed', period ? { period } : {});
    }

    const report: BenchmarkReport = {
      tenantId: result.tenant_id,
      period: result.period,
      dataPoints: result.data_points.map((dp) => ({
        dimension: dp.dimension,
        value: dp.value,
        percentile: dp.percentile,
        platformMedian: dp.platform_median,
        platformP25: dp.platform_p25,
        platformP75: dp.platform_p75,
        sampleSize: dp.sample_size,
        period: dp.period,
      })),
      overallScore: result.overall_score,
      overallPercentile: result.overall_percentile,
      insights: result.insights,
      recommendations: result.recommendations,
    };

    return { success: true, data: report };
  } catch (error) {
    log.error('Benchmark fetch failed', { error });
    return { success: false, error: 'Failed to load benchmarks' };
  }
}

/**
 * Get platform-wide benchmark aggregates.
 */
export async function getPlatformBenchmarks(
  period?: string
): Promise<{ success: boolean; data?: PlatformAggregates; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    const result = await benchmarkPlatformAggregates(period);
    if (!result) {
      return { success: false, error: 'Benchmark service unavailable' };
    }

    return {
      success: true,
      data: {
        period: result.period,
        totalTenants: result.total_tenants,
        dimensions: result.dimensions.map((d) => ({
          dimension: d.dimension,
          median: d.median,
          p25: d.p25,
          p75: d.p75,
          sampleSize: d.sample_size,
        })),
      },
    };
  } catch (error) {
    log.error('Platform benchmarks fetch failed', { error });
    return { success: false, error: 'Failed to load platform benchmarks' };
  }
}
