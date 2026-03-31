/**
 * NexCore MCP SDK — Core transport layer.
 *
 * Provides the generic mcpCall() and typed call() helpers that all
 * domain modules use. Handles MCP response parsing including the
 * nested content[0].text JSON extraction.
 */

// ── Configuration ───────────────────────────────────────────────────────────

const NEXCORE_API_URL = typeof window === 'undefined'
  ? (process.env.NEXCORE_API_URL ?? 'http://localhost:3030')
  : ''

const MCP_BASE = typeof window === 'undefined'
  ? `${NEXCORE_API_URL}/api/v1/mcp`
  : '/api/nexcore/api/v1/mcp'

const DEFAULT_TIMEOUT_MS = 30_000

// ── Types ───────────────────────────────────────────────────────────────────

export interface NexcoreError {
  code: string
  message: string
  details?: unknown
}

export interface McpToolResponse<T = unknown> {
  tool: string
  success: boolean
  result: T
}

interface McpRawContent {
  type: string
  text: string
}

interface McpRawResult {
  content?: McpRawContent[]
}

export interface McpCallOptions {
  timeout?: number
  signal?: AbortSignal
}

/** Standard 2x2 contingency table for signal detection. */
export interface SignalInput {
  a: number
  b: number
  c: number
  d: number
}

// ── Generic MCP Caller ──────────────────────────────────────────────────────

/**
 * Call any MCP tool by name. Handles response parsing including the nested
 * content[0].text JSON extraction that MCP responses use.
 */
export async function mcpCall<T = unknown>(
  tool: string,
  params: object = {},
  options?: McpCallOptions,
): Promise<McpToolResponse<T>> {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(),
    options?.timeout ?? DEFAULT_TIMEOUT_MS,
  )

  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort())
  }

  try {
    const res = await fetch(`${MCP_BASE}/${tool}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params }),
      signal: controller.signal,
    })

    const body = await res.json().catch(() => ({ message: res.statusText }))

    if (!res.ok) {
      const err = body as Partial<NexcoreError>
      throw Object.assign(
        new Error(err.message ?? `MCP ${tool}: ${res.status}`),
        { code: err.code ?? 'MCP_ERROR', status: res.status },
      )
    }

    const raw = body as McpToolResponse<McpRawResult>
    const parsed = extractMcpPayload<T>(raw.result)

    return { tool: raw.tool, success: raw.success, result: parsed }
  } finally {
    clearTimeout(timer)
  }
}

/** Extract typed payload from MCP's nested content[0].text JSON. */
function extractMcpPayload<T>(result: McpRawResult | T): T {
  if (result != null && typeof result === 'object' && 'content' in result) {
    const raw = result as McpRawResult
    const text = raw.content?.[0]?.text
    if (typeof text === 'string') {
      try {
        return JSON.parse(text) as T
      } catch {
        return text as unknown as T
      }
    }
  }
  return result as T
}

/**
 * Shorthand: call + return just the parsed result (throws on !success).
 * Every domain wrapper delegates to this.
 */
export async function call<T = unknown>(
  tool: string,
  params: object = {},
): Promise<T> {
  const resp = await mcpCall<T>(tool, params)
  if (!resp.success) {
    throw Object.assign(
      new Error(`MCP tool ${tool} returned failure`),
      { result: resp.result },
    )
  }
  return resp.result
}
