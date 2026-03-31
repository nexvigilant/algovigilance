import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

async function proxyToNexcore(req: NextRequest, method: string) {
  const { searchParams, pathname } = req.nextUrl;
  const path = pathname.replace('/api/nexcore/admin', '/admin');

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    };

    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await req.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // No body is fine for some requests
      }
    }

    const res = await fetch(
      `${NEXCORE_API_URL}/api/v1${path}${searchParams.toString() ? `?${searchParams}` : ''}`,
      fetchOptions,
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'NexCore API unavailable' }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  return proxyToNexcore(req, 'GET');
}

export async function POST(req: NextRequest) {
  return proxyToNexcore(req, 'POST');
}

export async function PATCH(req: NextRequest) {
  return proxyToNexcore(req, 'PATCH');
}

export async function DELETE(req: NextRequest) {
  return proxyToNexcore(req, 'DELETE');
}
