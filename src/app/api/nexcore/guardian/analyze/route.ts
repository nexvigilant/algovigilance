import { type NextRequest } from 'next/server';
import { proxyPost } from '@/lib/nexcore-proxy';

/**
 * POST /api/nexcore/guardian/analyze
 * Body: { a, b, c, d }
 * Proxies to nexcore-api POST /api/v1/guardian/analyze
 */
export async function POST(request: NextRequest) {
    return proxyPost('/api/v1/guardian/analyze', request);
}
