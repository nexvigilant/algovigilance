/**
 * DataFrame — client-side columnar data operations.
 *
 * Mirrors nexcore-dataframe crate patterns: parse → group → aggregate → sort.
 * Pure functions, no side effects, no React dependency.
 *
 * T1 primitives: σ(Sequence: row iteration) + κ(Comparison: sort/group)
 *              + N(Quantity: aggregation) + μ(Mapping: column transforms)
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** Aggregation operation */
export type AggOp = "sum" | "mean" | "min" | "max" | "count" | "none";

/** Aggregation spec: which operation to apply to which column */
export interface AggSpec {
  column: string;
  op: AggOp;
}

/** Result of parsing a CSV string */
export interface ParsedTable {
  columns: string[];
  rows: Record<string, string>[];
}

/** One row of grouped + aggregated results */
export interface GroupedRow {
  groupKeys: Record<string, string>;
  aggs: Record<string, number>;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Parse a CSV string into columns and rows.
 * First line is headers, remaining lines are data.
 */
export function parseCSV(csv: string): ParsedTable {
  const lines = csv
    .trim()
    .split("\n")
    .filter((l) => l.trim() !== "");
  if (lines.length < 2) return { columns: [], rows: [] };

  const columns = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    return Object.fromEntries(columns.map((h, i) => [h, vals[i] ?? ""]));
  });

  return { columns, rows };
}

/**
 * Check if all values in a column are numeric.
 */
export function isNumericColumn(
  rows: Record<string, string>[],
  col: string,
): boolean {
  return (
    rows.length > 0 &&
    rows.every((r) => r[col] !== undefined && !isNaN(Number(r[col])))
  );
}

/**
 * Group rows by key columns and apply aggregation operations.
 *
 * Like nexcore-dataframe's GroupBy::agg() but in TypeScript:
 * groups rows into buckets by groupCols, then applies aggSpecs
 * to numeric columns.
 */
export function groupByAndAggregate(
  rows: Record<string, string>[],
  groupCols: string[],
  aggSpecs: Record<string, AggOp>,
  allColumns: string[],
): GroupedRow[] {
  if (groupCols.length === 0) return [];

  const buckets = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const key = groupCols.map((c) => row[c] ?? "").join("||");
    const bucket = buckets.get(key) ?? [];
    bucket.push(row);
    buckets.set(key, bucket);
  }

  const results: GroupedRow[] = [];
  for (const [key, bucket] of buckets) {
    const keyParts = key.split("||");
    const groupKeys: Record<string, string> = Object.fromEntries(
      groupCols.map((c, i) => [c, keyParts[i] ?? ""]),
    );
    const aggs: Record<string, number> = {};

    for (const col of allColumns) {
      if (groupCols.includes(col)) continue;
      const spec = aggSpecs[col] ?? "none";
      if (spec === "none") continue;
      const nums = bucket.map((r) => Number(r[col])).filter((n) => !isNaN(n));
      if (nums.length === 0) continue;

      if (spec === "sum") aggs[col] = nums.reduce((a, b) => a + b, 0);
      else if (spec === "mean")
        aggs[col] = nums.reduce((a, b) => a + b, 0) / nums.length;
      else if (spec === "min") aggs[col] = Math.min(...nums);
      else if (spec === "max") aggs[col] = Math.max(...nums);
      else if (spec === "count") aggs[col] = nums.length;
    }

    results.push({ groupKeys, aggs });
  }

  return results;
}

/**
 * Sort grouped results by a column (group key or aggregated value).
 */
export function sortGroupedRows(
  rows: GroupedRow[],
  col: string,
  dir: "asc" | "desc",
): GroupedRow[] {
  return [...rows].sort((a, b) => {
    const aVal = a.groupKeys[col] ?? a.aggs[col] ?? 0;
    const bVal = b.groupKeys[col] ?? b.aggs[col] ?? 0;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return dir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    const numA = typeof aVal === "number" ? aVal : Number(aVal);
    const numB = typeof bVal === "number" ? bVal : Number(bVal);
    return dir === "asc" ? numA - numB : numB - numA;
  });
}
