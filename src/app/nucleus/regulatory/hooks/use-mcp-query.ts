'use client'

import { useState, useCallback, useEffect } from 'react'

interface McpContent {
  type: string
  text: string
}

interface McpResponse {
  content: McpContent[]
}

/** Shape of the parsed JSON inside MCP text content. */
interface ParsedMcpResult<T> {
  success: boolean
  data?: T[]
  results?: T[]
  meta?: {
    total?: number
    skip?: number
    limit?: number
    lastUpdated?: string
    last_updated?: string
  }
  error?: string
}

export interface UseMcpQueryOptions {
  tool: string
  params?: Record<string, unknown>
  enabled?: boolean
}

export interface McpQueryResult<T> {
  data: T[]
  total: number
  loading: boolean
  error: string | null
  lastUpdated: string | null
  refetch: () => Promise<void>
}

/**
 * Calls an MCP tool via the NexCore proxy.
 *
 * Request:  POST /api/nexcore/api/v1/mcp/{tool}  →  { params }
 * Response: { content: [{ type: "text", text: "<JSON>" }] }
 *
 * The JSON inside `text` must have `{ success, data|results, meta }`.
 */
export function useMcpQuery<T = Record<string, unknown>>({
  tool,
  params,
  enabled = true,
}: UseMcpQueryOptions): McpQueryResult<T> {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const execute = useCallback(
    async (currentParams: Record<string, unknown>, signal: AbortSignal) => {
      if (!tool || !enabled) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/nexcore/api/v1/mcp/${encodeURIComponent(tool)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ params: currentParams }),
          signal,
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        const mcpResp = (await res.json()) as McpResponse
        const textContent = mcpResp.content.find((c) => c.type === 'text')
        if (!textContent) {
          throw new Error('MCP response missing text content')
        }

        const result = JSON.parse(textContent.text) as ParsedMcpResult<T>
        if (!result.success) {
          throw new Error(result.error ?? 'MCP tool returned an error')
        }

        const rows = result.data ?? result.results ?? []
        setData(rows)
        setTotal(result.meta?.total ?? rows.length)
        setLastUpdated(
          result.meta?.lastUpdated ??
            result.meta?.last_updated ??
            new Date().toISOString(),
        )
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
        setData([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [tool, enabled],
  )

  // JSON-serialize params to detect meaningful changes without unstable object refs
  const paramsKey = JSON.stringify(params ?? {})

  useEffect(() => {
    const controller = new AbortController()
    const currentParams = JSON.parse(paramsKey) as Record<string, unknown>
    void execute(currentParams, controller.signal)
    return () => controller.abort()
  }, [execute, paramsKey])

  const refetch = useCallback(async () => {
    const controller = new AbortController()
    const currentParams = JSON.parse(paramsKey) as Record<string, unknown>
    await execute(currentParams, controller.signal)
  }, [execute, paramsKey])

  return { data, total, loading, error, lastUpdated, refetch }
}
