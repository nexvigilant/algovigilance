/**
 * useMathData — React hook for mathematical surface data with Wolfram validation.
 *
 * Provides the standard { data, loading, error, refetch } interface wrapping
 * the pure math function catalog from math-functions.ts. Functions are
 * evaluated client-side for immediate rendering. Selected functions are
 * validated in background via wolfram_calculate MCP tool — progressive
 * enrichment pattern proven in molecule/regulatory/state explorers.
 *
 * MCP enrichment: wolfram_calculate → server-side point validation.
 *
 * Migrated to useSWRData for wolfram validation caching and deduplication.
 *
 * Primitive formula: hook = μ(FunctionKey → FunctionDef) + ν(wolfram_validate)
 * — mapping of key to surface definition crossed with validation frequency.
 */

"use client";

import { useMemo } from "react";
import {
  FUNCTIONS,
  CATEGORIES,
  type FunctionKey,
  type FunctionDef,
  type Category,
} from "./math-functions";
import { mcpFetchText } from "@/lib/observatory/mcp-fetch";
import { useSWRData } from "@/hooks/use-swr-data";

// ─── Wolfram Expression Map ─────────────────────────────────────────────────
//
// Maps function keys to Wolfram Alpha-compatible expression templates.
// Uses {x} and {y} as substitution placeholders for sample point evaluation.
// Preserves math-functions.ts unchanged (criterion 2).

const WOLFRAM_EXPRESSIONS: Partial<Record<FunctionKey, string>> = {
  gaussian: "Exp[-({x}^2 + {y}^2)]",
  saddle: "{x}^2 - {y}^2",
  rosenbrock: "Log[1 + (1-{x})^2 + 100*({y}-{x}^2)^2]",
  sinc: "If[Sqrt[{x}^2+{y}^2]==0, 1, Sin[3*Sqrt[{x}^2+{y}^2]]/(3*Sqrt[{x}^2+{y}^2])]",
  peaks:
    "3*(1-{x})^2*Exp[-{x}^2-({y}+1)^2] - 10*({x}/5-{x}^3-{y}^5)*Exp[-{x}^2-{y}^2] - (1/3)*Exp[-({x}+1)^2-{y}^2]",
  "shannon-entropy":
    "-({x}*Log[2,{x}+0.001] + {y}*Log[2,{y}+0.001] + (1-{x}-{y})*Log[2, Max[0.001, 1-{x}-{y}]])",
};

// ─── Wolfram Result Parsing ─────────────────────────────────────────────────

/** Parse a numerical value from wolfram_calculate text response. */
function parseWolframNumber(text: string): number | null {
  // Wolfram returns markdown like "## Result\n1.41421356..." or "## Decimal approximation\n3.14159..."
  const lines = text
    .split("\n")
    .filter((l) => l.trim().length > 0 && !l.startsWith("#"));
  for (const line of lines) {
    // Strip ellipsis and whitespace, take first number-like token
    const cleaned = line
      .replace(/\.{3,}$/, "")
      .replace(/…$/, "")
      .trim();
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return null;
}

/** Substitute x,y values into a Wolfram expression template. */
function substitutePoint(template: string, x: number, y: number): string {
  return template
    .replace(/\{x\}/g, x.toFixed(4))
    .replace(/\{y\}/g, y.toFixed(4));
}

// ─── Wolfram Validation State ───────────────────────────────────────────────

export interface WolframValidation {
  /** Whether wolfram validation is in progress. */
  loading: boolean;
  /** Whether the selected function passed wolfram validation. */
  validated: boolean | null;
  /** Server-computed value at sample point. */
  serverValue: number | null;
  /** Client-computed value at same sample point. */
  clientValue: number | null;
  /** Sample point used for validation. */
  samplePoint: [number, number] | null;
  /** Error message if wolfram call failed. */
  error: string | null;
}

// ─── Wolfram SWR Result ─────────────────────────────────────────────────────

interface WolframResult {
  validated: boolean;
  serverValue: number;
  clientValue: number;
  samplePoint: [number, number];
}

// ─── Wolfram Fetcher ────────────────────────────────────────────────────────

async function fetchWolframValidation(
  fnKey: FunctionKey,
): Promise<WolframResult> {
  const wolframExpr = WOLFRAM_EXPRESSIONS[fnKey];
  if (!wolframExpr) {
    throw new Error("No wolfram expression mapped for this function");
  }

  // Pick a sample point at 1/3 of range (avoids origin singularities and range edges)
  const fn = FUNCTIONS[fnKey];
  const range = fn.range;
  const sampleX = range[0] + (range[1] - range[0]) * 0.33;
  const sampleY = range[0] + (range[1] - range[0]) * 0.67;

  // Compute client-side value at sample point
  const clientValue = fn.fn(sampleX, sampleY);
  const expression = substitutePoint(wolframExpr, sampleX, sampleY);

  const text = await mcpFetchText("wolfram_calculate", { expression });

  const serverValue = parseWolframNumber(text);
  if (serverValue === null) {
    throw new Error("Could not parse numerical result");
  }

  // Compare with tolerance — relative for large values, absolute for small
  const tolerance = Math.max(Math.abs(clientValue) * 0.01, 0.001);
  const validated = Math.abs(serverValue - clientValue) < tolerance;

  return {
    validated,
    serverValue,
    clientValue,
    samplePoint: [sampleX, sampleY],
  };
}

// ─── Hook State ─────────────────────────────────────────────────────────────

interface MathDataState {
  functions: Record<FunctionKey, FunctionDef>;
  categories: typeof CATEGORIES;
  filteredKeys: FunctionKey[];
  loading: boolean;
  error: string | null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Data hook for the math explorer.
 *
 * Returns the full function catalog with category filtering and optional
 * Wolfram Alpha validation for the currently selected function.
 * Client-side computation renders immediately; wolfram enriches in background.
 *
 * @param category - Filter functions by category, or 'all' for everything
 * @param selectedFn - Currently selected function key for wolfram validation
 */
export function useMathData(
  category: Category | "all" = "all",
  selectedFn?: FunctionKey,
): MathDataState & { refetch: () => void; wolfram: WolframValidation } {
  const filteredKeys = useMemo(() => {
    return (Object.keys(FUNCTIONS) as FunctionKey[]).filter(
      (key) => category === "all" || FUNCTIONS[key].category === category,
    );
  }, [category]);

  // ── Wolfram Validation via SWR ──────────────────────────────────────────

  // Only fetch when the function has a wolfram expression mapped
  const hasWolframExpr = selectedFn
    ? WOLFRAM_EXPRESSIONS[selectedFn] !== undefined
    : false;
  const wolframKey =
    selectedFn && hasWolframExpr ? `wolfram-${selectedFn}` : null;

  const {
    data: wolframData,
    error: wolframError,
    isLoading: wolframLoading,
    retry,
  } = useSWRData<WolframResult>(
    wolframKey,
    () => fetchWolframValidation(selectedFn!),
    { showToast: false },
  );

  const wolfram: WolframValidation = {
    loading: wolframLoading,
    validated: wolframData?.validated ?? null,
    serverValue: wolframData?.serverValue ?? null,
    clientValue: wolframData?.clientValue ?? null,
    samplePoint: wolframData?.samplePoint ?? null,
    error: wolframError?.message ?? null,
  };

  return {
    functions: FUNCTIONS,
    categories: CATEGORIES,
    filteredKeys,
    loading: false,
    error: null,
    refetch: retry,
    wolfram,
  };
}
