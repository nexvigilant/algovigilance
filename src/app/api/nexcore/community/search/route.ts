import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

/**
 * GET /api/nexcore/community/search?q=query&filter=all
 * Proxy to NexCore Rust-powered community search.
 * Falls back to 503 when NexCore unavailable (Studio uses Firestore search as backup).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const filter = searchParams.get('filter') || 'all';

  if (!query.trim()) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${NEXCORE_API_URL}/api/v1/community/search?q=${encodeURIComponent(query)}&filter=${encodeURIComponent(filter)}`,
      {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Search failed', status: res.status },
      { status: res.status }
    );
  } catch {
    return NextResponse.json(
      { error: 'NexCore search unavailable', fallback: true },
      { status: 503 }
    );
  }
}
