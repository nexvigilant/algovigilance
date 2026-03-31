import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${NEXCORE_API_URL}/api/v1/graph/converge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => ({ data: await r.json(), status: r.status }));

  return NextResponse.json(res.data, { status: res.status });
}
