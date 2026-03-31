/**
 * In-memory dev signal aggregator (singleton).
 * Collects poor CWV scores, runtime errors, auth gaps, and slow renders.
 * No-ops in production. 5-minute sliding window with deduplication.
 *
 * Follows the errorWindow Map pattern from error-reporting.ts.
 */

const isDev = process.env.NODE_ENV !== 'production';

type SignalType = 'cwv_poor' | 'runtime_error' | 'auth_gap' | 'slow_render' | 'integration_gap';

interface DevSignal {
  type: SignalType;
  page: string;
  source_file?: string;
  detail: string;
  value?: number;
  count: number;
  first_seen: string;
  last_seen: string;
}

interface RecordSignalInput {
  type: SignalType;
  page: string;
  detail: string;
  value?: number;
}

/** Sliding window of dev signals, keyed by type:page:detail */
const signals = new Map<string, DevSignal>();

function makeKey(type: string, page: string, detail: string): string {
  return `${type}:${page}:${detail}`;
}

/**
 * Map a URL path to the likely Next.js source file.
 * /nucleus/community/circles → src/app/nucleus/community/circles/page.tsx
 */
function mapUrlToSourceFile(urlPath: string): string | undefined {
  if (!urlPath) return undefined;
  if (urlPath === '/') return 'src/app/page.tsx';
  const clean = urlPath.replace(/^\//, '').replace(/\/$/, '');
  return `src/app/${clean}/page.tsx`;
}

function pruneStale(windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  const stale: string[] = [];
  signals.forEach((signal, key) => {
    if (new Date(signal.last_seen).getTime() < cutoff) {
      stale.push(key);
    }
  });
  stale.forEach((key) => signals.delete(key));
}

/**
 * Record a dev signal. No-ops in production.
 * Deduplicates by composite key (type + page + detail).
 */
export function recordSignal(input: RecordSignalInput): void {
  if (!isDev) return;

  const key = makeKey(input.type, input.page, input.detail);
  const now = new Date().toISOString();
  const existing = signals.get(key);

  if (existing) {
    existing.count++;
    existing.last_seen = now;
    if (input.value !== undefined) existing.value = input.value;
  } else {
    signals.set(key, {
      type: input.type,
      page: input.page,
      source_file: mapUrlToSourceFile(input.page),
      detail: input.detail,
      value: input.value,
      count: 1,
      first_seen: now,
      last_seen: now,
    });
  }
}

const FIX_NOW_TYPES = new Set<SignalType>(['cwv_poor', 'runtime_error', 'integration_gap']);

/**
 * Build a categorized signal digest for the current window.
 * fix_now = actionable (cwv_poor, runtime_error)
 * investigate = needs judgment (auth_gap, slow_render)
 */
export function getSignalDigest(windowMinutes?: number) {
  const minutes = windowMinutes ?? 5;
  const windowMs = minutes * 60_000;
  pruneStale(windowMs);

  const fixNow: DevSignal[] = [];
  const investigate: DevSignal[] = [];
  const uniquePages = new Set<string>();
  let totalOccurrences = 0;

  signals.forEach((signal) => {
    uniquePages.add(signal.page);
    totalOccurrences += signal.count;
    if (FIX_NOW_TYPES.has(signal.type)) {
      fixNow.push({ ...signal });
    } else {
      investigate.push({ ...signal });
    }
  });

  fixNow.sort((a, b) => b.count - a.count);
  investigate.sort((a, b) => b.count - a.count);

  return {
    timestamp: new Date().toISOString(),
    window_minutes: minutes,
    signal_count: fixNow.length + investigate.length,
    fix_now: fixNow,
    investigate,
    context: {
      total_signals: totalOccurrences,
      unique_pages: uniquePages.size,
      window_start: new Date(Date.now() - windowMs).toISOString(),
    },
  };
}

/** Clear all signals. Called via ?clear=true on the digest endpoint. */
export function clearSignals(): void {
  signals.clear();
}
