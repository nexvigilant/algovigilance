import { type NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/nexcore-proxy';

/**
 * GET  /api/nexcore/guardian/keys  — list API keys (masked)
 * POST /api/nexcore/guardian/keys  — create a new API key
 */
export async function GET(request: NextRequest) {
    return proxyGet('/api/v1/guardian/keys', request);
}

export async function POST(request: NextRequest) {
    return proxyPost('/api/v1/guardian/keys', request);
}
