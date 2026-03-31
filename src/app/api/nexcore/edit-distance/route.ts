import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

const EDIT_DISTANCE_ENDPOINTS: Record<string, string> = {
  similarity: '/api/v1/edit-distance/similarity',
  compute: '/api/v1/edit-distance/compute',
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { method, ...params } = body;
  const endpoint = EDIT_DISTANCE_ENDPOINTS[method];

  if (!endpoint) {
    return NextResponse.json(
      { error: `Invalid method "${method}". Use: ${Object.keys(EDIT_DISTANCE_ENDPOINTS).join(', ')}` },
      { status: 400 }
    );
  }

  const res = await fetch(`${NEXCORE_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
