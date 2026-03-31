'use client'

/**
 * Hook to fetch tool definitions from the REST registry endpoint.
 *
 * GET /api/nexcore/api/v1/mcp/registry returns the compiled param schemas
 * derived from Rust schemars — the source of truth for parameter names,
 * types, and required flags.
 *
 * Falls back gracefully when the backend is unavailable.
 */

import { useState, useEffect } from 'react'
import type { ParamDef, ToolDef, DomainGroup } from './types'
import { TOOL_CATALOG } from './tool-catalog'

// ── Backend response types ────────────────────────────────────────────────

interface RegistryParam {
  name: string
  type: string
  required: boolean
  description: string
}

interface RegistryTool {
  name: string
  description: string
  domain: string
  params: RegistryParam[]
}

interface RegistryResponse {
  count: number
  tools: RegistryTool[]
}

// ── Type mapping ──────────────────────────────────────────────────────────

/** Map JSON Schema types from the backend to the frontend ParamDef union. */
function mapParamType(backendType: string): ParamDef['type'] {
  switch (backendType) {
    case 'string': return 'string'
    case 'number': return 'number'
    case 'integer': return 'number'
    case 'boolean': return 'boolean'
    default: return 'object' // array, object, or unknown -> object (JSON input)
  }
}

function toParamDef(p: RegistryParam): ParamDef {
  return {
    name: p.name,
    type: mapParamType(p.type),
    required: p.required,
    description: p.description || undefined,
  }
}

// ── Merge logic ───────────────────────────────────────────────────────────

/**
 * Merge the live registry into the static catalog:
 * - For tools present in the registry: override params with registry data
 * - For tools NOT in the registry (dispatch-only): keep static catalog as-is
 * - Registry tools not in the static catalog: add them into their domain group
 */
function mergeCatalog(
  staticCatalog: DomainGroup[],
  registryTools: RegistryTool[],
): { catalog: DomainGroup[]; registryNames: Set<string> } {
  const registryMap = new Map<string, RegistryTool>()
  for (const rt of registryTools) {
    registryMap.set(rt.name, rt)
  }

  const registryNames = new Set(registryMap.keys())
  const seenNames = new Set<string>()

  // Pass 1: update tools already in the static catalog
  const merged: DomainGroup[] = staticCatalog.map((group) => ({
    ...group,
    tools: group.tools.map((tool): ToolDef => {
      seenNames.add(tool.name)
      const rt = registryMap.get(tool.name)
      if (rt) {
        return {
          ...tool,
          description: rt.description || tool.description,
          params: rt.params.map(toParamDef),
        }
      }
      return tool
    }),
  }))

  // Pass 2: add registry tools not present in the static catalog
  const newByDomain = new Map<string, ToolDef[]>()
  for (const rt of registryTools) {
    if (seenNames.has(rt.name)) continue
    const tools = newByDomain.get(rt.domain) ?? []
    tools.push({
      name: rt.name,
      description: rt.description,
      domain: rt.domain,
      params: rt.params.map(toParamDef),
    })
    newByDomain.set(rt.domain, tools)
  }

  for (const [domain, tools] of newByDomain) {
    const existing = merged.find((g) => g.domain === domain)
    if (existing) {
      existing.tools.push(...tools)
    } else {
      merged.push({
        domain,
        label: domain.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Tools in the ${domain} domain`,
        tools,
      })
    }
  }

  return { catalog: merged, registryNames }
}

// ── Hook ──────────────────────────────────────────────────────────────────

export type RegistryStatus = 'loading' | 'live' | 'fallback'

export interface UseToolRegistryResult {
  /** The merged catalog (registry + static fallback) */
  catalog: DomainGroup[]
  /** Total tool count */
  totalTools: number
  /** Total domain count */
  totalDomains: number
  /** Set of tool names that came from the live registry */
  registryNames: Set<string>
  /** Registry fetch status */
  status: RegistryStatus
  /** Number of registry-backed tools */
  registryCount: number
}

export function useToolRegistry(): UseToolRegistryResult {
  const [catalog, setCatalog] = useState<DomainGroup[]>(TOOL_CATALOG)
  const [registryNames, setRegistryNames] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<RegistryStatus>('loading')

  useEffect(() => {
    let cancelled = false

    async function fetchRegistry() {
      try {
        const res = await fetch('/api/nexcore/api/v1/mcp/registry', {
          signal: AbortSignal.timeout(10_000),
        })

        if (!res.ok) {
          throw new Error(`Registry returned ${res.status}`)
        }

        const data: RegistryResponse = await res.json()

        if (cancelled) return

        const { catalog: merged, registryNames: names } = mergeCatalog(TOOL_CATALOG, data.tools)
        setCatalog(merged)
        setRegistryNames(names)
        setStatus('live')
      } catch {
        if (cancelled) return
        setStatus('fallback')
      }
    }

    fetchRegistry()

    return () => { cancelled = true }
  }, [])

  const totalTools = catalog.reduce((sum, g) => sum + g.tools.length, 0)
  const totalDomains = catalog.length

  return {
    catalog,
    totalTools,
    totalDomains,
    registryNames,
    status,
    registryCount: registryNames.size,
  }
}
