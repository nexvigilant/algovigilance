import { type NextRequest, NextResponse } from 'next/server';
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { checkPublicRateLimit } from '@/lib/rate-limit';

const log = logger.scope('api/telemetry/vitals');

interface VitalsPayload {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  url: string;
  timestamp: number;
}

const COLLECTION = 'telemetry_vitals';

/**
 * POST /api/telemetry/vitals
 *
 * Receives Core Web Vitals (LCP, FID, CLS, TTFB, INP, FCP) from the client.
 * Persists to Firestore and logs with severity based on rating.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rateLimit = await checkPublicRateLimit('telemetry_vital');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const vital = await req.json() as VitalsPayload;

    if (!vital.name || vital.value === undefined) {
      return NextResponse.json({ error: 'Missing name or value' }, { status: 400 });
    }

    // Persist to Firestore
    await adminDb.collection(COLLECTION).add({
      name: vital.name,
      value: vital.value,
      rating: vital.rating,
      delta: vital.delta,
      url: vital.url || '',
      navigationType: vital.navigationType || '',
      vitalId: vital.id || '',
      clientTimestamp: vital.timestamp,
      createdAt: adminTimestamp.now(),
    });

    const logData = {
      metric: vital.name,
      value: vital.value,
      rating: vital.rating,
      delta: vital.delta,
      url: vital.url,
      navigationType: vital.navigationType,
      ts: vital.timestamp,
    };

    if (vital.rating === 'poor') {
      log.warn(`[VITAL] ${vital.name} POOR`, logData);
    } else if (vital.rating === 'needs-improvement') {
      log.info(`[VITAL] ${vital.name} needs-improvement`, logData);
    } else {
      log.debug(`[VITAL] ${vital.name} good`, logData);
    }

    return NextResponse.json({ received: true, persisted: true }, { status: 200 });
  } catch (err) {
    log.error('Failed to process vitals', err);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
