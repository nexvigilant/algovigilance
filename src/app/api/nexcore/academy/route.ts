import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl;
  const path = pathname.replace('/api/nexcore/academy', '/academy');

  try {
    const res = await fetch(`${NEXCORE_API_URL}/api/v1${path}${searchParams.toString() ? `?${searchParams}` : ''}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'NexCore API unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const path = pathname.replace('/api/nexcore/academy', '/academy');

  try {
    const body = await req.json();
    const res = await fetch(`${NEXCORE_API_URL}/api/v1${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'NexCore API unavailable' }, { status: 503 });
  }
}
