/**
 * Jupyter REST API Client — Server-Side Only
 *
 * Shared fetch wrapper for all Jupyter proxy routes. Handles token discovery,
 * base URL resolution, timeout, and structured error reporting.
 *
 * Token precedence:
 *   1. process.env.JUPYTER_TOKEN
 *   2. Parsed from ~/.jupyter/jupyter_server_config.py (c.IdentityProvider.token)
 *
 * Base URL precedence:
 *   1. process.env.JUPYTER_URL
 *   2. http://localhost:8888 (default)
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const DEFAULT_JUPYTER_URL = "http://localhost:8888";
const DEFAULT_TIMEOUT_MS = 15_000;

// ── Token discovery ──────────────────────────────────────────────────────────

function parseTokenFromConfig(configPath: string): string | null {
  let raw: string;
  try {
    raw = readFileSync(configPath, "utf-8");
  } catch {
    return null;
  }

  // Match: c.IdentityProvider.token = "some-token"
  // Also handles single quotes and optional whitespace around =
  const match = raw.match(/c\.IdentityProvider\.token\s*=\s*["']([^"']+)["']/);
  return match ? match[1] : null;
}

function resolveToken(): string | null {
  if (process.env.JUPYTER_TOKEN) {
    return process.env.JUPYTER_TOKEN;
  }

  const configPath = join(homedir(), ".jupyter", "jupyter_server_config.py");
  return parseTokenFromConfig(configPath);
}

function resolveBaseUrl(): string {
  return (process.env.JUPYTER_URL ?? DEFAULT_JUPYTER_URL).replace(/\/$/, "");
}

// ── Typed error ──────────────────────────────────────────────────────────────

export class JupyterClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "JupyterClientError";
  }
}

// ── Core fetch helper ────────────────────────────────────────────────────────

export interface JupyterFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: string;
  timeoutMs?: number;
}

/**
 * Proxy a single request to the Jupyter REST API.
 *
 * @param endpoint - Path relative to Jupyter root, e.g. `/api/status`
 * @param options  - Method, body, and timeout overrides
 * @returns Parsed JSON response
 * @throws JupyterClientError on non-2xx responses
 * @throws Error on connection failure or timeout
 */
export async function jupyterFetch<T = unknown>(
  endpoint: string,
  options: JupyterFetchOptions = {},
): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const token = resolveToken();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Jupyter request timed out after ${timeoutMs}ms (${url})`,
      );
    }
    // Connection refused, DNS failure, etc.
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot reach Jupyter server at ${baseUrl}: ${cause}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new JupyterClientError(
      response.status,
      `Jupyter API error ${response.status} at ${endpoint}: ${text.slice(0, 200)}`,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Build a Jupyter API path for a notebook content endpoint.
 * Percent-encodes the path but preserves forward slashes.
 */
export function contentPath(notebookPath: string): string {
  const segments = notebookPath.split("/").map(encodeURIComponent);
  return `/api/contents/${segments.join("/")}`;
}
