import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

/**
 * POST /api/nexcore/community/analyze
 * Analyze community content using NexCore Rust computation.
 * Extracts primitives, detects PV signals, classifies topics.
 *
 * Falls back to lightweight local analysis when NexCore is unavailable.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || !body.content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  try {
    // Try NexCore computation first
    const res = await fetch(`${NEXCORE_API_URL}/api/v1/community/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: body.content,
        post_id: body.postId,
        title: body.title,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Fall through to local analysis
  } catch {
    // NexCore unavailable, use local fallback
  }

  // Local fallback: lightweight content analysis
  const analysis = analyzeContentLocal(body.content, body.title);
  return NextResponse.json({ ...analysis, source: 'local' });
}

// ── Local fallback analysis ──────────────────────

const PV_KEYWORDS = [
  'adverse event', 'adverse reaction', 'side effect', 'safety signal',
  'drug interaction', 'contraindication', 'toxicity', 'overdose',
  'withdrawal', 'hypersensitivity', 'anaphylaxis', 'hepatotoxicity',
  'nephrotoxicity', 'cardiotoxicity', 'teratogenic', 'carcinogenic',
  'ICSR', 'PSUR', 'PBRER', 'DSUR', 'RMP', 'REMS',
  'MedDRA', 'WHO-ART', 'serious adverse event', 'SAE', 'SUSAR',
];

const PRIMITIVE_PATTERNS: Record<string, { symbol: string; keywords: string[] }> = {
  Causality: { symbol: '→', keywords: ['cause', 'effect', 'trigger', 'leads to', 'results in', 'induces'] },
  Boundary: { symbol: '∂', keywords: ['threshold', 'limit', 'boundary', 'maximum', 'minimum', 'range'] },
  Comparison: { symbol: 'κ', keywords: ['compare', 'versus', 'difference', 'similar', 'match', 'correlation'] },
  Quantity: { symbol: 'N', keywords: ['count', 'rate', 'frequency', 'incidence', 'prevalence', 'dose'] },
  Sequence: { symbol: 'σ', keywords: ['timeline', 'sequence', 'progression', 'onset', 'duration', 'course'] },
  State: { symbol: 'ς', keywords: ['status', 'condition', 'phase', 'stage', 'level', 'grade'] },
  Mapping: { symbol: 'μ', keywords: ['classification', 'mapping', 'coding', 'categorization', 'translation'] },
  Persistence: { symbol: 'π', keywords: ['history', 'record', 'documentation', 'reporting', 'database', 'registry'] },
};

function analyzeContentLocal(content: string, title?: string) {
  const text = `${title || ''} ${content}`.toLowerCase();

  // Detect PV relevance
  const pvMatches = PV_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
  const pvRelevance = Math.min(pvMatches.length / 3, 1.0);

  // Extract primitives
  const primitives: { name: string; symbol: string; confidence: number }[] = [];
  for (const [name, { symbol, keywords }] of Object.entries(PRIMITIVE_PATTERNS)) {
    const matches = keywords.filter(kw => text.includes(kw));
    if (matches.length > 0) {
      primitives.push({
        name,
        symbol,
        confidence: Math.min(matches.length / keywords.length, 1.0),
      });
    }
  }

  // Topic classification
  const topics: string[] = [];
  if (pvMatches.length > 0) topics.push('pharmacovigilance');
  if (text.match(/signal|detect|prr|ror|ebgm/)) topics.push('signal-detection');
  if (text.match(/regulatory|guideline|ich|ema|fda/)) topics.push('regulatory');
  if (text.match(/case|icsr|report|narrative/)) topics.push('case-processing');
  if (text.match(/risk|benefit|assessment|evaluation/)) topics.push('risk-assessment');
  if (text.match(/learn|course|pathway|competenc/)) topics.push('education');

  return {
    postId: null,
    pvRelevance,
    pvKeywords: pvMatches,
    primitives: primitives.sort((a, b) => b.confidence - a.confidence),
    topics,
    signalHints: pvRelevance > 0.5
      ? pvMatches.filter(kw =>
          kw.includes('signal') || kw.includes('adverse') || kw.includes('SAE')
        )
      : [],
  };
}
