import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

/* eslint-disable @nexvigilant/no-sequential-awaits -- each if-branch is mutually exclusive, awaits cannot be parallelized */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const drug = searchParams.get('drug');
  const query = searchParams.get('query');
  const limit = searchParams.get('limit') || '10';

  const action = searchParams.get('action');

  // Signal graph: combined events + signal detection in one call
  if (action === 'signal-graph' && drug) {
    const signalTopN = searchParams.get('signal_top_n') || '5';
    const res = await fetch(
      `${NEXCORE_API_URL}/api/v1/faers/signal-graph?drug=${encodeURIComponent(drug)}&limit=${limit}&signal_top_n=${signalTopN}`,
      { headers: { 'Content-Type': 'application/json' } }
    ).then(async (r) => ({ data: await r.json(), status: r.status }));
    return NextResponse.json(res.data, { status: res.status });
  }

  if (drug) {
    const res = await fetch(
      `${NEXCORE_API_URL}/api/v1/faers/drug-events?drug=${encodeURIComponent(drug)}&limit=${limit}`,
      { headers: { 'Content-Type': 'application/json' } }
    ).then(async (r) => ({ data: await r.json(), status: r.status }));
    return NextResponse.json(res.data, { status: res.status });
  }

  if (query) {
    const res = await fetch(
      `${NEXCORE_API_URL}/api/v1/faers/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: { 'Content-Type': 'application/json' } }
    ).then(async (r) => ({ data: await r.json(), status: r.status }));
    return NextResponse.json(res.data, { status: res.status });
  }

  return NextResponse.json(
    { error: 'Missing drug or query parameter' },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${NEXCORE_API_URL}/api/v1/faers/signal-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => ({ data: await r.json(), status: r.status }));

  return NextResponse.json(res.data, { status: res.status });
}
