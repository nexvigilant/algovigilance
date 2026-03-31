/**
 * Microgram Engine — Client-side decision tree executor.
 *
 * Runs rsk-core microgram decision trees entirely in the browser.
 * Each microgram is an atomic, self-testing decision program.
 *
 * Anatomy (structure) = MicrogramDef (what it IS)
 * Physiology (function) = runMicrogram() (what it DOES)
 */

// --- Types ---

export interface MicrogramNode {
  type: "condition" | "return";
  /** For condition nodes */
  variable?: string;
  operator?:
    | "eq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "matches"
    | "is_null"
    | "is_not_null";
  value?: number | string | boolean;
  true_next?: string;
  false_next?: string;
  /** For return nodes */
  return_value?: Record<string, unknown>;
}

export interface MicrogramTree {
  start: string;
  nodes: Record<string, MicrogramNode>;
}

export interface MicrogramTest {
  input: Record<string, unknown>;
  expect: Record<string, unknown>;
}

export interface MicrogramField {
  name: string;
  label: string;
  description: string;
  type: "number" | "select" | "boolean";
  min?: number;
  max?: number;
  step?: number;
  default?: number | string | boolean;
  options?: { value: number | string; label: string }[];
}

export interface MicrogramDef {
  name: string;
  title: string;
  description: string;
  chapter_ref: string;
  icon: string;
  version: string;
  /** Anatomy — the input form fields */
  fields: MicrogramField[];
  /** Physiology — the decision tree */
  tree: MicrogramTree;
  /** Self-tests for validation */
  tests: MicrogramTest[];
  /** Human-readable explanation of what each output field means */
  output_guide: Record<string, string>;
  /** Chains: which micrograms this connects to */
  chains_from?: string[];
  chains_to?: string[];
}

export interface MicrogramResult {
  success: boolean;
  output: Record<string, unknown>;
  path: string[];
  duration_us: number;
}

// --- Engine ---

function compare(
  actual: unknown,
  operator: string,
  expected: unknown,
): boolean {
  // Handle null/undefined
  if (actual === null || actual === undefined) {
    if (operator === "is_null") return true;
    if (operator === "is_not_null") return false;
    // null defaults to 0 for numeric comparisons (matches rsk-core behavior)
    actual = 0;
  }

  if (operator === "is_null") return actual === null || actual === undefined;
  if (operator === "is_not_null")
    return actual !== null && actual !== undefined;

  const a = typeof actual === "string" ? actual : Number(actual);
  const b = typeof expected === "string" ? expected : Number(expected);

  switch (operator) {
    case "eq":
      return a === b;
    case "gt":
      return a > b;
    case "gte":
      return a >= b;
    case "lt":
      return a < b;
    case "lte":
      return a <= b;
    case "matches":
      return typeof a === "string" && typeof b === "string"
        ? new RegExp(b).test(a)
        : false;
    default:
      return false;
  }
}

export function runMicrogram(
  def: MicrogramDef,
  input: Record<string, unknown>,
): MicrogramResult {
  const start = performance.now();
  const path: string[] = [];
  let current = def.tree.start;
  let iterations = 0;
  const maxIterations = 100; // safety valve

  while (iterations < maxIterations) {
    iterations++;
    const node = def.tree.nodes[current];
    if (!node) {
      return {
        success: false,
        output: { error: `Node not found: ${current}` },
        path,
        duration_us: (performance.now() - start) * 1000,
      };
    }

    path.push(current);

    if (node.type === "return") {
      return {
        success: true,
        output: node.return_value ?? {},
        path,
        duration_us: (performance.now() - start) * 1000,
      };
    }

    if (node.type === "condition") {
      const actual = input[node.variable ?? ""];
      const result = compare(actual, node.operator ?? "eq", node.value);
      current = result ? (node.true_next ?? "") : (node.false_next ?? "");
      continue;
    }

    return {
      success: false,
      output: { error: `Unknown node type at: ${current}` },
      path,
      duration_us: (performance.now() - start) * 1000,
    };
  }

  return {
    success: false,
    output: { error: "Max iterations exceeded" },
    path,
    duration_us: (performance.now() - start) * 1000,
  };
}

/** Run all self-tests for a microgram, return pass/fail counts */
export function selfTest(def: MicrogramDef): {
  passed: number;
  failed: number;
  total: number;
  failures: {
    index: number;
    expected: Record<string, unknown>;
    actual: Record<string, unknown>;
  }[];
} {
  let passed = 0;
  const failures: {
    index: number;
    expected: Record<string, unknown>;
    actual: Record<string, unknown>;
  }[] = [];

  for (let i = 0; i < def.tests.length; i++) {
    const test = def.tests[i];
    const result = runMicrogram(def, test.input);

    const allMatch = Object.entries(test.expect).every(([key, val]) => {
      const actual = result.output[key];
      if (typeof val === "object" && val !== null) {
        return JSON.stringify(actual) === JSON.stringify(val);
      }
      return actual === val;
    });

    if (allMatch) {
      passed++;
    } else {
      failures.push({
        index: i,
        expected: test.expect,
        actual: result.output as Record<string, unknown>,
      });
    }
  }

  return {
    passed,
    failed: failures.length,
    total: def.tests.length,
    failures,
  };
}
