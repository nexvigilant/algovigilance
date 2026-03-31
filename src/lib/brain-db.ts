/**
 * Brain database reader — local-only SQLite access via CLI.
 *
 * Uses `sqlite3 -json` to query brain.db. This only works when Nucleus
 * runs on the same machine as Claude Code (dev mode). On Vercel, these
 * routes return 503 with a clear message.
 *
 * Why not better-sqlite3: native compilation breaks Vercel deployment.
 * Why not nexcore-api proxy: brain.db isn't exposed via the REST API.
 * This is the pragmatic boundary — shell out to sqlite3 CLI.
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

const BRAIN_DB = `${process.env.HOME}/.claude/brain/brain.db`;

export function isBrainAvailable(): boolean {
  return existsSync(BRAIN_DB);
}

export function queryBrain<T = Record<string, unknown>>(sql: string): T[] {
  if (!isBrainAvailable()) {
    throw new BrainUnavailableError();
  }

  // Sanitize: reject any write operations
  const upper = sql.toUpperCase().trim();
  if (
    upper.startsWith("INSERT") ||
    upper.startsWith("UPDATE") ||
    upper.startsWith("DELETE") ||
    upper.startsWith("DROP") ||
    upper.startsWith("ALTER") ||
    upper.startsWith("CREATE")
  ) {
    throw new Error("Brain DB is read-only from Nucleus");
  }

  try {
    const result = execSync(
      `sqlite3 -json '${BRAIN_DB}' "${sql.replace(/"/g, '\\"')}"`,
      {
        encoding: "utf-8",
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      },
    );

    if (!result.trim()) return [];
    return JSON.parse(result) as T[];
  } catch (err) {
    if (err instanceof SyntaxError) return [];
    throw err;
  }
}

export function queryBrainScalar(sql: string): string | null {
  if (!isBrainAvailable()) return null;

  const upper = sql.toUpperCase().trim();
  if (!upper.startsWith("SELECT")) return null;

  try {
    const result = execSync(
      `sqlite3 '${BRAIN_DB}' "${sql.replace(/"/g, '\\"')}"`,
      {
        encoding: "utf-8",
        timeout: 5000,
      },
    );
    return result.trim() || null;
  } catch {
    return null;
  }
}

export class BrainUnavailableError extends Error {
  constructor() {
    super(
      "Brain database not available. This feature requires running Nucleus locally on the same machine as Claude Code.",
    );
    this.name = "BrainUnavailableError";
  }
}
