import { type NextRequest } from 'next/server';
import { proxyMethodDispatch } from '@/lib/nexcore-proxy';

const STATS_ENDPOINTS: Record<string, string> = {
  'welch-ttest': '/api/v1/stats/welch-ttest',
  'ols-regression': '/api/v1/stats/ols-regression',
  'poisson-ci': '/api/v1/stats/poisson-ci',
  'bayesian-posterior': '/api/v1/stats/bayesian-posterior',
  entropy: '/api/v1/stats/entropy',
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(STATS_ENDPOINTS, request);
}
