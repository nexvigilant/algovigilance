/**
 * LiveBus — Server-side pub/sub event bus for SSE streaming.
 *
 * Publishers (API routes) push typed events. Subscribers (SSE connections)
 * receive all events in arrival order. Single bus instance per process.
 *
 * Channels:
 *   "signal"  — drug-event signal detection results
 *   "station" — station health frames
 *   "god"     — domain governor events (claim/feed/report)
 *   "system"  — composite scores, phase transitions
 */

export type BusChannel = "signal" | "station" | "god" | "system";

export interface BusEvent {
  channel: BusChannel;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

type Subscriber = (event: BusEvent) => void;

class LiveBus {
  private subscribers = new Map<string, Set<Subscriber>>();
  private history: BusEvent[] = [];
  private maxHistory = 100;

  /** Subscribe to a channel. Returns unsubscribe function. */
  subscribe(channel: BusChannel | "*", fn: Subscriber): () => void {
    const key = channel;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(fn);

    return () => {
      this.subscribers.get(key)?.delete(fn);
    };
  }

  /** Publish an event to a channel. */
  publish(event: BusEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    // Notify channel-specific subscribers
    this.subscribers.get(event.channel)?.forEach((fn) => {
      try {
        fn(event);
      } catch {
        // subscriber error — don't crash the bus
      }
    });

    // Notify wildcard subscribers
    this.subscribers.get("*")?.forEach((fn) => {
      try {
        fn(event);
      } catch {
        // subscriber error
      }
    });
  }

  /** Get recent history for replay on new connections. */
  getHistory(channel?: BusChannel, limit = 20): BusEvent[] {
    const filtered = channel
      ? this.history.filter((e) => e.channel === channel)
      : this.history;
    return filtered.slice(-limit);
  }

  /** Number of active subscribers across all channels. */
  get subscriberCount(): number {
    let count = 0;
    this.subscribers.forEach((set) => {
      count += set.size;
    });
    return count;
  }
}

// Singleton — one bus per Next.js process
const globalForBus = globalThis as unknown as { liveBus: LiveBus };
export const liveBus = globalForBus.liveBus ?? new LiveBus();
if (process.env.NODE_ENV !== "production") {
  globalForBus.liveBus = liveBus;
}
