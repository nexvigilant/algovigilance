import { type NextRequest } from 'next/server';
import { proxyMethodDispatch } from '@/lib/nexcore-proxy';

const EPI_ENDPOINTS: Record<string, string> = {
  'relative-risk':         '/api/v1/mcp/epi_relative_risk',
  'odds-ratio':            '/api/v1/mcp/epi_odds_ratio',
  'attributable-risk':     '/api/v1/mcp/epi_attributable_risk',
  'nnt':                   '/api/v1/mcp/epi_nnt_nnh',
  'attributable-fraction': '/api/v1/mcp/epi_attributable_fraction',
  'population-af':         '/api/v1/mcp/epi_population_af',
  'incidence-rate':        '/api/v1/mcp/epi_incidence_rate',
  'prevalence':            '/api/v1/mcp/epi_prevalence',
  'kaplan-meier':          '/api/v1/mcp/epi_kaplan_meier',
  'smr':                   '/api/v1/mcp/epi_smr',
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(EPI_ENDPOINTS, request);
}
