import { type NextRequest } from 'next/server';
import { proxyGet } from '@/lib/nexcore-proxy';

/**
 * GET /api/nexcore/billing/portal?customer_id={id}&return_url={url}
 * Proxies to nexcore-api GET /api/v1/billing/portal
 */
export async function GET(request: NextRequest) {
    return proxyGet('/api/v1/billing/portal', request);
}
