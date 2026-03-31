import { type NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { hoursToMs } from '@/lib/constants/timing';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/admin-auth';

const log = logger.scope('api/telemetry/dashboard');

interface VitalsSummary {
  metric: string;
  count: number;
  avg: number;
  p75: number;
  p95: number;
  good: number;
  needsImprovement: number;
  poor: number;
}

interface EventSummary {
  event: string;
  count: number;
  lastSeen: number;
  topUrls: Array<{ url: string; count: number }>;
}

/**
 * GET /api/telemetry/dashboard
 *
 * Aggregated telemetry dashboard. Returns vitals summary, event counts,
 * and top pages for the requested time window.
 *
 * Query params:
 *   hours=24 (default) — lookback window
 *   type=all|vitals|events (default: all)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const hours = Math.min(Number(searchParams.get('hours')) || 24, 168); // max 7 days
    const type = searchParams.get('type') || 'all';
    const since = new Date(Date.now() - hoursToMs(hours));

    const result: {
      window: { hours: number; since: string };
      vitals?: VitalsSummary[];
      events?: EventSummary[];
      totalEvents?: number;
      totalVitals?: number;
      topPages?: Array<{ url: string; views: number }>;
    } = {
      window: { hours, since: since.toISOString() },
    };

    // Vitals aggregation
    if (type === 'all' || type === 'vitals') {
      const vitalsSnap = await adminDb
        .collection('telemetry_vitals')
        .where('createdAt', '>=', since)
        .orderBy('createdAt', 'desc')
        .limit(5000)
        .get();

      const vitalsByMetric = new Map<string, Array<{ value: number; rating: string }>>();
      for (const doc of vitalsSnap.docs) {
        const d = doc.data();
        const name = d.name as string;
        if (!vitalsByMetric.has(name)) vitalsByMetric.set(name, []);
        vitalsByMetric.get(name)?.push({ value: d.value as number, rating: d.rating as string });
      }

      result.vitals = Array.from(vitalsByMetric.entries()).map(([metric, samples]) => {
        const sorted = samples.map((s) => s.value).sort((a, b) => a - b);
        const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
        const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;

        return {
          metric,
          count: samples.length,
          avg: Math.round(avg * 100) / 100,
          p75: Math.round(p75 * 100) / 100,
          p95: Math.round(p95 * 100) / 100,
          good: samples.filter((s) => s.rating === 'good').length,
          needsImprovement: samples.filter((s) => s.rating === 'needs-improvement').length,
          poor: samples.filter((s) => s.rating === 'poor').length,
        };
      });
      result.totalVitals = vitalsSnap.size;
    }

    // Events aggregation
    if (type === 'all' || type === 'events') {
      const eventsSnap = await adminDb
        .collection('telemetry_events')
        .where('createdAt', '>=', since)
        .orderBy('createdAt', 'desc')
        .limit(5000)
        .get();

      const eventsByName = new Map<string, Array<{ url: string; ts: number }>>();
      const pageViews = new Map<string, number>();

      for (const doc of eventsSnap.docs) {
        const d = doc.data();
        const event = d.event as string;
        const url = d.url as string;

        if (!eventsByName.has(event)) eventsByName.set(event, []);
        eventsByName.get(event)?.push({
          url,
          ts: d.clientTimestamp as number,
        });

        if (event === 'page_view') {
          pageViews.set(url, (pageViews.get(url) || 0) + 1);
        }
      }

      result.events = Array.from(eventsByName.entries())
        .map(([event, entries]) => {
          const urlCounts = new Map<string, number>();
          for (const e of entries) {
            urlCounts.set(e.url, (urlCounts.get(e.url) || 0) + 1);
          }
          const topUrls = Array.from(urlCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([url, count]) => ({ url, count }));

          return {
            event,
            count: entries.length,
            lastSeen: Math.max(...entries.map((e) => e.ts)),
            topUrls,
          };
        })
        .sort((a, b) => b.count - a.count);

      result.totalEvents = eventsSnap.size;

      result.topPages = Array.from(pageViews.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([url, views]) => ({ url, views }));
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    log.error('Dashboard query failed', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
