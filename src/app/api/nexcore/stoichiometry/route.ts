import { type NextRequest } from 'next/server';
import { proxyMethodDispatch } from '@/lib/nexcore-proxy';

const STOICHIOMETRY_ENDPOINTS: Record<string, string> = {
  encode: '/api/v1/mcp/lex_primitiva_composition',
  decode: '/api/v1/mcp/lex_primitiva_reverse_compose',
  sisters: '/api/v1/mcp/brand_semantic_tiers',
  mass_state: '/api/v1/mcp/lex_primitiva_molecular_weight',
  dictionary: '/api/v1/mcp/lex_primitiva_list',
};

export async function POST(request: NextRequest) {
  return proxyMethodDispatch(STOICHIOMETRY_ENDPOINTS, request);
}
