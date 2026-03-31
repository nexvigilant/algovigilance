import { type NextRequest } from 'next/server';
import { proxyGet } from '@/lib/nexcore-proxy';

/**
 * GET /api/nexcore/guardian/usage
 * Proxies to nexcore-api GET /api/v1/guardian/usage
 */
export async function GET(request: NextRequest) {
    return proxyGet('/api/v1/guardian/usage', request);
}
