import { type NextRequest } from 'next/server';
import { proxyMethodDispatch } from '@/lib/nexcore-proxy';

const PK_ENDPOINTS: Record<string, string> = {
  auc: '/api/v1/pk/auc',
  clearance: '/api/v1/pk/clearance',
  'steady-state': '/api/v1/pk/steady-state',
  'volume-distribution': '/api/v1/pk/volume-distribution',
  'michaelis-menten': '/api/v1/pk/michaelis-menten',
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(PK_ENDPOINTS, request);
}
