import { type NextRequest } from 'next/server';
import { proxyPost } from '@/lib/nexcore-proxy';

export async function POST(request: NextRequest) {
  return proxyPost('/api/v1/pv/signal/complete', request);
}
