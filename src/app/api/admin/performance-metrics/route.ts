import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getRecentMetrics,
  getMetricsSummary,
  type PerformanceMetric,
} from '@/app/nucleus/community/actions/utils/performance';

import { logger } from '@/lib/logger';
const log = logger.scope('api/performance-metrics');

/**
 * Performance Metrics API
 *
 * Returns performance metrics collected from server actions.
 * Admin-only endpoint for monitoring and debugging.
 *
 * GET /api/admin/performance-metrics
 * Query params:
 *   - format: 'json' | 'summary' | 'csv' (default: 'json')
 *
 * @returns Performance metrics in requested format
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    // Parse query params
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    const metrics = getRecentMetrics();
    const summary = getMetricsSummary();

    if (format === 'summary') {
      return NextResponse.json({
        success: true,
        summary,
        totalMetrics: metrics.length,
        collectedSince: metrics[0]?.timestamp || null,
      });
    }

    if (format === 'csv') {
      const csv = convertToCSV(metrics);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="performance-metrics-${Date.now()}.csv"`,
        },
      });
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      metrics,
      summary,
      totalMetrics: metrics.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    log.error('Error fetching performance metrics', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * Convert metrics to CSV format
 */
function convertToCSV(metrics: PerformanceMetric[]): string {
  if (metrics.length === 0) {
    return 'action,duration_ms,timestamp,query_count,metadata\n';
  }

  const headers = ['action', 'duration_ms', 'timestamp', 'query_count', 'metadata'];
  const rows = metrics.map((m) => [
    m.action,
    m.duration.toString(),
    m.timestamp,
    m.queryCount?.toString() || '',
    m.metadata ? JSON.stringify(m.metadata) : '',
  ]);

  return [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
}
