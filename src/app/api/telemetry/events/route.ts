import { type NextRequest, NextResponse } from 'next/server';
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { checkPublicRateLimit } from '@/lib/rate-limit';

const log = logger.scope('api/telemetry/events');

interface TelemetryEvent {
  event: string;
  properties?: Record<string, string | number | boolean | undefined>;
  timestamp: number;
  url: string;
  sessionId?: string;
}

const COLLECTION = 'telemetry_events';
const BATCH_LIMIT = 500; // Firestore batch write limit

/**
 * POST /api/telemetry/events
 *
 * Receives client-side analytics events, persists to Firestore, and logs.
 * Supports single events or batched arrays.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rateLimit = await checkPublicRateLimit('telemetry_event');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json() as TelemetryEvent | TelemetryEvent[];
    const events = Array.isArray(body) ? body : [body];
    const valid = events.filter((e) => e.event);

    if (valid.length === 0) {
      return NextResponse.json({ received: 0 }, { status: 200 });
    }

    // Batch write to Firestore
    const batch = adminDb.batch();
    for (const event of valid.slice(0, BATCH_LIMIT)) {
      const ref = adminDb.collection(COLLECTION).doc();
      batch.set(ref, {
        event: event.event,
        url: event.url || '',
        sessionId: event.sessionId || null,
        properties: event.properties || {},
        clientTimestamp: event.timestamp,
        createdAt: adminTimestamp.now(),
      });

      log.info(`[EVENT] ${event.event}`, {
        url: event.url,
        sessionId: event.sessionId,
        ...event.properties,
        ts: event.timestamp,
      });
    }

    await batch.commit();

    return NextResponse.json({ received: valid.length, persisted: true }, { status: 200 });
  } catch (err) {
    log.error('Failed to process telemetry events', err);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
