import { type NextRequest, NextResponse } from 'next/server';
import { proxyPost, proxyGet } from '@/lib/nexcore-proxy';

const endpointMap: Record<string, string> = {
  'create': '/api/v1/sos/create',
  'transition': '/api/v1/sos/transition',
  'state': '/api/v1/sos/state',
  'history': '/api/v1/sos/history',
  'validate': '/api/v1/sos/validate',
};

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') ?? 'state';

  const endpoint = endpointMap[action];
  if (!endpoint) {
    return NextResponse.json(
      { error: `Unknown SOS action: ${action}. Valid: ${Object.keys(endpointMap).join(', ')}` },
      { status: 400 }
    );
  }

  return proxyPost(endpoint, request);
}

export async function GET(request: NextRequest) {
  return proxyGet('/api/v1/sos/list', request);
}
