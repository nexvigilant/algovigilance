import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pathwayId = searchParams.get('pathway_id');
  const userId = searchParams.get('user_id');

  if (!pathwayId) {
    return NextResponse.json(
      { error: 'Missing pathway_id parameter' },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({ pathway_id: pathwayId });
  if (userId) params.set('user_id', userId);

  const res = await fetch(
    `${NEXCORE_API_URL}/api/v1/learning/dag?${params.toString()}`,
    { headers: { 'Content-Type': 'application/json' } }
  ).then(async (r) => ({ data: await r.json(), status: r.status }));

  return NextResponse.json(res.data, { status: res.status });
}
