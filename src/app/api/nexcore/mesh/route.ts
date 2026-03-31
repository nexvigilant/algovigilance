import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get('action') || 'search';
  const query = searchParams.get('query') || '';
  const identifier = searchParams.get('identifier') || '';
  const descriptorUi = searchParams.get('descriptor_ui') || '';
  const direction = searchParams.get('direction') || 'descendants';
  const term = searchParams.get('term') || '';

  try {
    let endpoint: string;
    const params = new URLSearchParams();

    switch (action) {
      case 'search':
        if (!query) return NextResponse.json({ results: [] });
        endpoint = '/api/v1/mesh/search';
        params.set('query', query);
        params.set('limit', searchParams.get('limit') || '20');
        break;
      case 'lookup':
        if (!identifier) return NextResponse.json({ error: 'identifier required' }, { status: 400 });
        endpoint = '/api/v1/mesh/lookup';
        params.set('identifier', identifier);
        break;
      case 'tree':
        if (!descriptorUi) return NextResponse.json({ error: 'descriptor_ui required' }, { status: 400 });
        endpoint = '/api/v1/mesh/tree';
        params.set('descriptor_ui', descriptorUi);
        params.set('direction', direction);
        params.set('depth', searchParams.get('depth') || '3');
        break;
      case 'crossref':
        if (!term) return NextResponse.json({ error: 'term required' }, { status: 400 });
        endpoint = '/api/v1/mesh/crossref';
        params.set('term', term);
        params.set('source', searchParams.get('source') || 'meddra');
        params.set('targets', searchParams.get('targets') || 'mesh,snomed,ich');
        break;
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const res = await fetch(`${NEXCORE_API_URL}${endpoint}?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `NexCore ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'NexCore unavailable' }, { status: 502 });
  }
}
