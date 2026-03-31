import { type NextRequest } from 'next/server';
import { proxyMethodDispatch } from '@/lib/nexcore-proxy';

const CAUSALITY_ENDPOINTS: Record<string, string> = {
  naranjo: '/api/v1/pv/naranjo',
  'who-umc': '/api/v1/pv/who-umc',
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(CAUSALITY_ENDPOINTS, request);
}
