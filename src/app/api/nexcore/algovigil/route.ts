import { type NextRequest } from 'next/server';
import { proxyMethodDispatch } from '@/lib/nexcore-proxy';

const ALGOVIGIL_ENDPOINTS: Record<string, string> = {
  'dedup-pair': '/api/v1/algovigil/dedup/pair',
  'triage-queue': '/api/v1/algovigil/triage/queue',
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(ALGOVIGIL_ENDPOINTS, request);
}
