import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

export async function GET() {
  const res = await fetch(`${NEXCORE_API_URL}/api/v1/guardian/status`, {
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'tick';

  const endpoint =
    action === 'reset'
      ? '/api/v1/guardian/reset'
      : '/api/v1/guardian/tick';

  const res = await fetch(`${NEXCORE_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
