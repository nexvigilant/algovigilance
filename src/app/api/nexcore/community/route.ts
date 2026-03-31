import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

/**
 * Build headers for NexCore requests.
 * Forwards tenant context when available (PRPaaS multi-tenant).
 */
function buildHeaders(tenantId?: string, userId?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tenantId) headers['X-Tenant-Id'] = tenantId;
  if (userId) headers['X-User-Id'] = userId;
  return headers;
}

/**
 * GET /api/nexcore/community
 * Proxy to NexCore community endpoints.
 * ?action=posts|circles|suggestions|for-you|experts|benchmarks
 *
 * PRPaaS: Forwards X-Tenant-Id and X-User-Id headers for multi-tenant scoping.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'posts';
  const tenantId = searchParams.get('tenantId') || undefined;
  const userId = searchParams.get('userId') || undefined;

  const endpointMap: Record<string, string> = {
    posts: '/api/v1/community/posts',
    circles: '/api/v1/community/circles',
    messages: '/api/v1/community/messages',
    suggestions: '/api/v1/community/suggestions',
    'for-you': '/api/v1/community/for-you',
    // PRPaaS: Expert marketplace
    experts: '/api/v1/marketplace/experts',
    'expert-recommend': '/api/v1/marketplace/experts/recommend',
    // PRPaaS: Benchmarking
    benchmarks: '/api/v1/benchmarks',
    'benchmarks-platform': '/api/v1/benchmarks/platform',
  };

  const endpoint = endpointMap[action];
  if (!endpoint) {
    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  }

  // Forward query params (excluding action/tenantId/userId)
  const forwardParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (!['action', 'tenantId', 'userId'].includes(key)) {
      forwardParams.set(key, value);
    }
  });
  // Add tenant for benchmark requests
  if (tenantId && (action === 'benchmarks' || action === 'expert-recommend')) {
    forwardParams.set('tenant', tenantId);
  }

  const queryString = forwardParams.toString();
  const url = `${NEXCORE_API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

  try {
    const res = await fetch(url, {
      headers: buildHeaders(tenantId, userId),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'NexCore community API unavailable', fallback: true },
      { status: 503 }
    );
  }
}

/**
 * POST /api/nexcore/community
 * Proxy to NexCore community write endpoints.
 * ?action=create-post|join-circle|send-message|expert-engage
 *
 * PRPaaS: Forwards tenant context headers.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'create-post';

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const tenantId = body.tenantId || undefined;
  const userId = body.userId || undefined;

  const endpointMap: Record<string, string> = {
    'create-post': '/api/v1/community/posts',
    'send-message': '/api/v1/community/messages',
    // PRPaaS: Expert marketplace
    'expert-engage': '/api/v1/marketplace/engagements',
  };

  // Handle circle join (requires circleId in body)
  if (action === 'join-circle' && body.circleId) {
    try {
      const res = await fetch(
        `${NEXCORE_API_URL}/api/v1/community/circles/${body.circleId}/join`,
        {
          method: 'POST',
          headers: buildHeaders(tenantId, userId),
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        }
      );
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json(
        { error: 'NexCore community API unavailable' },
        { status: 503 }
      );
    }
  }

  const endpoint = endpointMap[action];
  if (!endpoint) {
    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${NEXCORE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(tenantId, userId),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'NexCore community API unavailable' },
      { status: 503 }
    );
  }
}
