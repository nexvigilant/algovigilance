import { type NextRequest, NextResponse } from 'next/server';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

/**
 * POST /api/nexcore/code-gen
 * Proxy to NexCore code generation endpoint.
 * Falls back to local template generation if NexCore API is unavailable.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.prompt) {
    return NextResponse.json(
      { message: 'Missing required field: prompt' },
      { status: 400 }
    );
  }

  try {
    // Try NexCore API first
    const res = await fetch(`${NEXCORE_API_URL}/api/v1/forge/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: body.prompt }),
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Fallback: generate locally from prompt analysis
    return NextResponse.json(generateFromPrompt(body.prompt));
  } catch {
    // NexCore unavailable — use local generation
    return NextResponse.json(generateFromPrompt(body.prompt));
  }
}

// ── Local fallback generator ──────────────────

interface PrimitiveMapping {
  symbol: string;
  name: string;
  rustPattern: string;
}

const PRIMITIVE_MAP: Record<string, PrimitiveMapping> = {
  sequence:       { symbol: 'σ', name: 'Sequence',       rustPattern: 'Iterator, Vec, method chains' },
  mapping:        { symbol: 'μ', name: 'Mapping',        rustPattern: 'From/Into, map(), and_then()' },
  state:          { symbol: 'ς', name: 'State',          rustPattern: 'struct, Mutex, Cell, typestates' },
  recursion:      { symbol: 'ρ', name: 'Recursion',      rustPattern: 'Box<Self>, recursive enums' },
  void:           { symbol: '∅', name: 'Void',           rustPattern: 'Option::None, (), !, PhantomData' },
  boundary:       { symbol: '∂', name: 'Boundary',       rustPattern: 'Result, guards, max_iterations' },
  frequency:      { symbol: 'ν', name: 'Frequency',      rustPattern: 'Counters, rate limiters, polling' },
  existence:      { symbol: '∃', name: 'Existence',      rustPattern: 'new(), constructors, Some' },
  persistence:    { symbol: 'π', name: 'Persistence',    rustPattern: 'DB, files, static, logs' },
  causality:      { symbol: '→', name: 'Causality',      rustPattern: 'fn, callbacks, event triggers' },
  comparison:     { symbol: 'κ', name: 'Comparison',     rustPattern: '==, Ord, match, if let' },
  quantity:       { symbol: 'N', name: 'Quantity',        rustPattern: 'u32, f64, usize' },
  location:       { symbol: 'λ', name: 'Location',       rustPattern: 'Path, pointers, indices, URLs' },
  irreversibility:{ symbol: '∝', name: 'Irreversibility',rustPattern: 'Drop, consuming methods, hashes' },
  sum:            { symbol: 'Σ', name: 'Sum',            rustPattern: 'enum, match, Either' },
  product:        { symbol: '×', name: 'Product',        rustPattern: 'struct, tuples, zip()' },
};

function detectPrimitives(prompt: string): PrimitiveMapping[] {
  const lower = prompt.toLowerCase();
  const found: PrimitiveMapping[] = [];

  for (const [keyword, mapping] of Object.entries(PRIMITIVE_MAP)) {
    if (lower.includes(keyword) || lower.includes(mapping.symbol)) {
      found.push(mapping);
    }
  }

  // Heuristic detection from common patterns
  if (lower.includes('rate limit') || lower.includes('throttl')) {
    addIfMissing(found, 'frequency');
    addIfMissing(found, 'boundary');
    addIfMissing(found, 'state');
  }
  if (lower.includes('cache') || lower.includes('lru')) {
    addIfMissing(found, 'mapping');
    addIfMissing(found, 'persistence');
    addIfMissing(found, 'boundary');
  }
  if (lower.includes('pipeline') || lower.includes('chain')) {
    addIfMissing(found, 'sequence');
    addIfMissing(found, 'mapping');
  }
  if (lower.includes('validat')) {
    addIfMissing(found, 'boundary');
    addIfMissing(found, 'comparison');
  }
  if (lower.includes('event') || lower.includes('callback')) {
    addIfMissing(found, 'causality');
  }
  if (lower.includes('state machine') || lower.includes('typestate')) {
    addIfMissing(found, 'state');
    addIfMissing(found, 'sum');
  }

  return found.length > 0 ? found : [PRIMITIVE_MAP.existence, PRIMITIVE_MAP.boundary];
}

function addIfMissing(found: PrimitiveMapping[], key: string) {
  if (!found.some((p) => p.symbol === PRIMITIVE_MAP[key].symbol)) {
    found.push(PRIMITIVE_MAP[key]);
  }
}

function generateFromPrompt(prompt: string) {
  const primitives = detectPrimitives(prompt);
  const symbols = primitives.map((p) => p.symbol);
  const structName = extractStructName(prompt);

  const lines: string[] = [];
  lines.push(`// Generated from: ${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}`);
  lines.push(`// Primitives: ${symbols.join(' ')}`);
  lines.push('');
  lines.push('#![deny(clippy::unwrap_used, clippy::expect_used)]');
  lines.push('#![forbid(unsafe_code)]');
  lines.push('');
  lines.push('use std::collections::HashMap;');
  if (symbols.includes('∂')) lines.push('use thiserror::Error;');
  lines.push('');

  // Error type if boundary present
  if (symbols.includes('∂')) {
    lines.push('#[derive(Debug, Error)]');
    lines.push(`pub enum ${structName}Error {`);
    lines.push(`    #[error("validation failed: {0}")]`);
    lines.push('    Validation(String),');
    lines.push(`    #[error("capacity exceeded")]`);
    lines.push('    CapacityExceeded,');
    lines.push(`    #[error("not found: {0}")]`);
    lines.push('    NotFound(String),');
    lines.push('}');
    lines.push('');
  }

  // State enum if state/sum present
  if (symbols.includes('ς') || symbols.includes('Σ')) {
    lines.push('#[derive(Debug, Clone, PartialEq)]');
    lines.push(`pub enum ${structName}State {`);
    lines.push('    Pending,');
    lines.push('    Active,');
    lines.push('    Complete,');
    lines.push('}');
    lines.push('');
  }

  // Main struct
  lines.push('#[derive(Debug)]');
  lines.push(`pub struct ${structName} {`);
  if (symbols.includes('ς')) lines.push(`    state: ${structName}State,`);
  if (symbols.includes('N')) lines.push('    count: u64,');
  if (symbols.includes('ν')) lines.push('    frequency: f64,');
  if (symbols.includes('π')) lines.push('    data: HashMap<String, String>,');
  if (symbols.includes('μ')) lines.push('    mappings: HashMap<String, String>,');
  if (symbols.includes('∂')) lines.push('    max_capacity: usize,');
  if (symbols.includes('λ')) lines.push('    location: String,');
  lines.push('}');
  lines.push('');

  // Implementation
  const errorType = symbols.includes('∂') ? `${structName}Error` : 'String';
  lines.push(`impl ${structName} {`);

  // Constructor (Existence)
  lines.push(`    pub fn new() -> Self {`);
  lines.push(`        Self {`);
  if (symbols.includes('ς')) lines.push(`            state: ${structName}State::Pending,`);
  if (symbols.includes('N')) lines.push('            count: 0,');
  if (symbols.includes('ν')) lines.push('            frequency: 0.0,');
  if (symbols.includes('π')) lines.push('            data: HashMap::new(),');
  if (symbols.includes('μ')) lines.push('            mappings: HashMap::new(),');
  if (symbols.includes('∂')) lines.push('            max_capacity: 1024,');
  if (symbols.includes('λ')) lines.push('            location: String::new(),');
  lines.push('        }');
  lines.push('    }');
  lines.push('');

  // Process method (Causality + Sequence)
  if (symbols.includes('→') || symbols.includes('σ')) {
    lines.push(`    pub fn process(&mut self) -> Result<(), ${errorType}> {`);
    if (symbols.includes('∂')) {
      lines.push('        self.validate()?;');
    }
    if (symbols.includes('ς')) {
      lines.push(`        self.state = ${structName}State::Active;`);
    }
    if (symbols.includes('N')) {
      lines.push('        self.count = self.count.saturating_add(1);');
    }
    if (symbols.includes('ς')) {
      lines.push(`        self.state = ${structName}State::Complete;`);
    }
    lines.push('        Ok(())');
    lines.push('    }');
    lines.push('');
  }

  // Validate (Boundary)
  if (symbols.includes('∂')) {
    lines.push(`    pub fn validate(&self) -> Result<(), ${errorType}> {`);
    if (symbols.includes('N')) {
      lines.push(`        if self.count as usize >= self.max_capacity {`);
      lines.push(`            return Err(${structName}Error::CapacityExceeded);`);
      lines.push('        }');
    }
    lines.push('        Ok(())');
    lines.push('    }');
    lines.push('');
  }

  // Compare (Comparison)
  if (symbols.includes('κ')) {
    lines.push('    pub fn matches(&self, other: &Self) -> bool {');
    if (symbols.includes('N')) {
      lines.push('        self.count == other.count');
    } else {
      lines.push('        true // Add comparison logic');
    }
    lines.push('    }');
    lines.push('');
  }

  lines.push('}');
  lines.push('');

  // Tests
  lines.push('#[cfg(test)]');
  lines.push('mod tests {');
  lines.push('    use super::*;');
  lines.push('');
  lines.push('    #[test]');
  lines.push(`    fn test_new() {`);
  lines.push(`        let instance = ${structName}::new();`);
  if (symbols.includes('N')) {
    lines.push('        assert_eq!(instance.count, 0);');
  }
  if (symbols.includes('ς')) {
    lines.push(`        assert_eq!(instance.state, ${structName}State::Pending);`);
  }
  lines.push('    }');
  if (symbols.includes('→') || symbols.includes('σ')) {
    lines.push('');
    lines.push('    #[test]');
    lines.push(`    fn test_process() {`);
    lines.push(`        let mut instance = ${structName}::new();`);
    lines.push('        assert!(instance.process().is_ok());');
    if (symbols.includes('ς')) {
      lines.push(`        assert_eq!(instance.state, ${structName}State::Complete);`);
    }
    lines.push('    }');
  }
  lines.push('}');

  return {
    code: lines.join('\n'),
    primitives: symbols,
    description: `Generated ${structName} using ${primitives.map((p) => `${p.symbol} ${p.name}`).join(', ')}. Each primitive maps to a Rust pattern: ${primitives.map((p) => `${p.symbol} → ${p.rustPattern}`).join('; ')}.`,
  };
}

function extractStructName(prompt: string): string {
  // Try to extract a meaningful name from the prompt
  const patterns = [
    /(?:a|an|the)\s+(\w+)\s+(?:struct|type|module)/i,
    /(?:create|build|generate|make)\s+(?:a|an)?\s*(\w+)/i,
    /(\w+)\s+(?:using|with|from)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const name = match[1];
      // Skip common words
      if (['the', 'a', 'an', 'that', 'this', 'my'].includes(name.toLowerCase())) continue;
      // PascalCase
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }

  return 'Generated';
}
