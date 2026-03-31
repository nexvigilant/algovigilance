/**
 * Compute comparison utilities for Rust vs TypeScript result verification.
 *
 * Used by compute-engine.ts to detect divergence between Rust (primary)
 * and TypeScript (verification) computation paths.
 *
 * T1 primitives: κ(Comparison) + N(Quantity) + ∂(Boundary)
 */

/**
 * Check if two numbers are close within relative tolerance.
 * Uses relative comparison for large values, absolute for near-zero.
 */
export function numClose(a: number, b: number, rtol: number = 1e-4): boolean {
  if (!isFinite(a) && !isFinite(b)) return true;
  if (!isFinite(a) || !isFinite(b)) return false;
  if (a === b) return true;

  const diff = Math.abs(a - b);
  const maxAbs = Math.max(Math.abs(a), Math.abs(b));

  // Near zero: use absolute tolerance
  if (maxAbs < 1e-10) return diff < rtol;

  // Otherwise: relative tolerance
  return diff / maxAbs < rtol;
}

/**
 * Compare Rust and TypeScript results field-by-field.
 * Returns null if results match, or a description of the first divergence.
 */
export function compareResults(
  rust: Record<string, unknown>,
  ts: Record<string, unknown>,
  numericFields: string[],
  rtol: number = 1e-4,
): string | null {
  for (const field of numericFields) {
    const rv = rust[field];
    const tv = ts[field];

    if (typeof rv === 'number' && typeof tv === 'number') {
      if (!numClose(rv, tv, rtol)) {
        return `Field "${field}" diverged: rust=${rv}, ts=${tv}, diff=${Math.abs(rv - tv)}`;
      }
    } else if (typeof rv === 'boolean' && typeof tv === 'boolean') {
      if (rv !== tv) {
        return `Field "${field}" diverged: rust=${rv}, ts=${tv}`;
      }
    }
  }

  return null;
}
