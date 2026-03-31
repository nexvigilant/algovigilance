import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSignalDigest, clearSignals } from '@/lib/dev-signal-store';

/**
 * GET /api/dev/signals
 *
 * Returns a structured JSON digest of actionable dev signals.
 * Gated: 404 in production.
 *
 * Query params:
 *   ?clear=true   — reset signals after reading
 *   ?window=N     — override window in minutes (default: 5)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const params = req.nextUrl.searchParams;
  const windowParam = params.get('window');
  const windowMinutes = windowParam ? Number(windowParam) : undefined;
  const shouldClear = params.get('clear') === 'true';

  const digest = getSignalDigest(windowMinutes);

  if (shouldClear) {
    clearSignals();
  }

  return NextResponse.json(digest);
}
