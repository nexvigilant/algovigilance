import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category');

  if (!query) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    const params = new URLSearchParams({ query });
    if (category) params.set('category', category);

    const res = await fetch(`${NEXCORE_API_URL}/api/v1/guidelines/search?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], total: 0 }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [], total: 0 }, { status: 502 });
  }
}
