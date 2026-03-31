import { adminDb } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from '@/app/nucleus/community/actions/utils/auth';
import { MODERATION_TIME_RANGES_MS } from '@/lib/constants/timing';
import { toDateFromSerialized } from '@/types/academy';
import { logger } from '@/lib/logger';

const log = logger.scope('admin/moderation/guardian-stream');

export const dynamic = 'force-dynamic';

type GuardianTimeRange = keyof typeof MODERATION_TIME_RANGES_MS;
const DEFAULT_TIME_RANGE: GuardianTimeRange = '7d';

function isGuardianTimeRange(value: string): value is GuardianTimeRange {
  return value in MODERATION_TIME_RANGES_MS;
}

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const timeRangeParam = url.searchParams.get('timeRange');
  const timeRange: GuardianTimeRange =
    timeRangeParam && isGuardianTimeRange(timeRangeParam)
      ? timeRangeParam
      : DEFAULT_TIME_RANGE;
  const startTime = new Date(Date.now() - MODERATION_TIME_RANGES_MS[timeRange]);

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: NodeJS.Timeout | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      sendEvent('connected', { ok: true, timeRange });

      let initialized = false;
      const query = adminDb
        .collection('guardian_audit_trail')
        .where('timestamp', '>=', startTime)
        .orderBy('timestamp', 'desc')
        .limit(50);

      unsubscribe = query.onSnapshot(
        (snapshot) => {
          if (!initialized) {
            initialized = true;
            return;
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type !== 'added' && change.type !== 'modified') return;

            const data = change.doc.data();
            const riskScore = data.risk?.score || 0;
            if (riskScore < 50) return;

            sendEvent('audit', {
              id: change.doc.id,
              userId: data.userId,
              activityId: data.activityId,
              type: data.type,
              risk: data.risk,
              timestamp: toDateFromSerialized(
                data.timestamp as Parameters<typeof toDateFromSerialized>[0]
              ).toISOString(),
            });
          });
        },
        (error) => {
          log.error('Guardian stream failed', { error });
          sendEvent('error', { message: 'Stream failure' });
        }
      );

      heartbeat = setInterval(() => {
        sendEvent('ping', { ts: new Date().toISOString() });
      }, 25000);

      request.signal.addEventListener('abort', () => {
        if (heartbeat) clearInterval(heartbeat);
        if (unsubscribe) unsubscribe();
        controller.close();
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
