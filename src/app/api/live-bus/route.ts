import { liveBus, type BusEvent } from "@/lib/live-bus";

export const dynamic = "force-dynamic";

/**
 * Unified SSE endpoint — subscribes to ALL bus channels.
 * Client gets a single EventSource connection for everything:
 * signals, station health, GoD governors, system events.
 *
 * On connect: replays last 20 events for instant hydration.
 * Then streams new events as they arrive from any publisher.
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: BusEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // connection closed
        }
      };

      // Replay recent history for instant hydration
      const history = liveBus.getHistory(undefined, 20);
      for (const event of history) {
        send(event);
      }

      // Subscribe to all future events
      const unsub = liveBus.subscribe("*", send);

      // Send keepalive every 15s to prevent connection timeout
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
          unsub();
        }
      }, 15_000);

      // Cleanup on client disconnect — ReadableStream cancel
      const originalCancel = controller.close.bind(controller);
      const cleanup = () => {
        clearInterval(keepalive);
        unsub();
      };

      // The stream will call cancel when the client disconnects
      void Promise.resolve().then(() => {
        const checkClosed = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(""));
          } catch {
            cleanup();
            clearInterval(checkClosed);
            try {
              originalCancel();
            } catch {
              // already closed
            }
          }
        }, 30_000);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    },
  });
}
