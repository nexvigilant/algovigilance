import { type NextRequest } from 'next/server';
import { proxyMethodDispatch } from '@/lib/nexcore-proxy';

const SURVEILLANCE_ENDPOINTS: Record<string, string> = {
  sprt: '/api/v1/surveillance/sprt',
  cusum: '/api/v1/surveillance/cusum',
  'weibull-tto': '/api/v1/surveillance/weibull-tto',
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(SURVEILLANCE_ENDPOINTS, request);
}
