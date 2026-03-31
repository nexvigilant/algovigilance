'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Play,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Cpu,
} from 'lucide-react'
import { mcpCall } from '@/lib/nexcore-mcp/core'
import { PARAM_SCHEMAS } from './param-schemas'
import { useToolRegistry } from './use-tool-registry'
import type { ToolDef, ParamDef } from './types'

/* ── Helpers ─────────────────────────────────────────────────────────── */

function matchesSearch(tool: ToolDef, query: string): boolean {
  const q = query.toLowerCase()
  return (
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.domain.toLowerCase().includes(q)
  )
}

function getParams(tool: ToolDef): ParamDef[] | undefined {
  return tool.params ?? PARAM_SCHEMAS[tool.name]
}

/* ── Component ───────────────────────────────────────────────────────── */

export function McpBrowser() {
  // Registry hook — fetches live param schemas from the backend
  const {
    catalog: toolCatalog,
    totalTools,
    totalDomains,
    registryNames,
    status: registryStatus,
    registryCount,
  } = useToolRegistry()

  // Discovery state
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null)

  // Invocation state
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [rawJson, setRawJson] = useState('{}')
  const [useRawJson, setUseRawJson] = useState(false)

  // Response state
  const [response, setResponse] = useState<unknown | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  /* ── Filtered catalog ───────────────────────────────────────────── */

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return toolCatalog
    return toolCatalog.map((group) => ({
      ...group,
      tools: group.tools.filter((t) => matchesSearch(t, searchQuery)),
    })).filter((g) => g.tools.length > 0)
  }, [searchQuery, toolCatalog])

  const filteredToolCount = useMemo(
    () => filteredCatalog.reduce((sum, g) => sum + g.tools.length, 0),
    [filteredCatalog],
  )

  /* ── Handlers ───────────────────────────────────────────────────── */

  const toggleDomain = useCallback((domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })
  }, [])

  const selectTool = useCallback((tool: ToolDef) => {
    setSelectedTool(tool)
    setParamValues({})
    setRawJson('{}')
    setUseRawJson(false)
    setResponse(null)
    setResponseTime(null)
    setError(null)
  }, [])

  const setParam = useCallback((name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const executeTool = useCallback(async () => {
    if (!selectedTool) return
    setLoading(true)
    setError(null)
    setResponse(null)
    setResponseTime(null)

    try {
      let params: Record<string, unknown>
      const typedParams = getParams(selectedTool)

      if (useRawJson || !typedParams) {
        params = JSON.parse(rawJson)
      } else {
        params = {}
        for (const p of typedParams) {
          const val = paramValues[p.name]
          if (val === undefined || val === '') continue
          if (p.type === 'number') params[p.name] = Number(val)
          else if (p.type === 'boolean') params[p.name] = val === 'true'
          else if (p.type === 'object') params[p.name] = JSON.parse(val)
          else params[p.name] = val
        }
      }

      const start = Date.now()
      const result = await mcpCall(selectedTool.name, params)
      setResponseTime(Date.now() - start)
      setResponse(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invocation failed')
    } finally {
      setLoading(false)
    }
  }, [selectedTool, useRawJson, rawJson, paramValues])

  const copyResponse = useCallback(async () => {
    if (!response) return
    await navigator.clipboard.writeText(JSON.stringify(response, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [response])

  /* ── Render ─────────────────────────────────────────────────────── */

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      {/* ── Left Panel: Discovery ─────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools, domains..."
            className="w-full bg-black/40 border border-white/[0.12] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-dim focus:outline-none focus:border-cyan/50 transition-colors"
          />
        </div>

        <p className="text-xs text-slate-dim">
          {searchQuery
            ? `${filteredToolCount} matching tools`
            : `${totalTools} tools across ${totalDomains} domains`}
        </p>

        {/* Registry status indicator */}
        {registryStatus === 'live' && (
          <p className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Registry live — {registryCount} tools with verified param schemas
          </p>
        )}
        {registryStatus === 'fallback' && (
          <p className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Registry unavailable — using static catalog
          </p>
        )}
        {registryStatus === 'loading' && (
          <p className="text-xs px-2 py-1 rounded bg-white/5 text-slate-dim border border-white/10 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading registry...
          </p>
        )}

        {/* Domain Accordion */}
        <div className="max-h-[600px] overflow-y-auto space-y-0.5 pr-1">
          {filteredCatalog.map((group) => (
            <div key={group.domain}>
              <button
                onClick={() => toggleDomain(group.domain)}
                className="w-full text-left px-2 py-1.5 flex items-center gap-2 hover:bg-white/5 rounded text-sm"
              >
                {expandedDomains.has(group.domain) ? (
                  <ChevronDown className="h-3 w-3 text-slate-dim shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-slate-dim shrink-0" />
                )}
                <span className="text-gold font-medium truncate">
                  {group.label}
                </span>
                <span className="text-xs text-slate-dim ml-auto shrink-0">
                  {group.tools.length}
                </span>
              </button>
              {expandedDomains.has(group.domain) && (
                <div className="ml-5 space-y-0.5">
                  {group.tools.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => selectTool(tool)}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-all ${
                        selectedTool?.name === tool.name
                          ? 'bg-cyan/10 border border-cyan/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="font-mono text-white">{tool.name}</span>
                      {registryNames.has(tool.name) && (
                        <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 leading-none">
                          R
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Detail + Invocation ──────────────────────── */}
      <div className="space-y-4">
        {selectedTool ? (
          <>
            {/* Tool Header */}
            <Card className="bg-white/[0.06] border border-white/[0.12]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-white text-base">
                    {selectedTool.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                    {selectedTool.domain}
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-dim">
                  {selectedTool.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Parameter Form */}
                {(() => {
                  const typedParams = getParams(selectedTool)
                  if (!typedParams || useRawJson) {
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-dim">
                            Parameters (JSON)
                          </label>
                          {typedParams && (
                            <button
                              onClick={() => setUseRawJson(false)}
                              className="flex items-center gap-1 text-xs text-cyan hover:text-cyan/80"
                            >
                              <ToggleRight className="h-3 w-3" />
                              Switch to form
                            </button>
                          )}
                        </div>
                        <textarea
                          value={rawJson}
                          onChange={(e) => setRawJson(e.target.value)}
                          className="w-full bg-black/40 border border-white/[0.12] rounded p-3 text-xs font-mono text-white resize-y min-h-[100px] focus:outline-none focus:border-cyan/50"
                          placeholder='{ "key": "value" }'
                        />
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-dim">
                          Parameters
                        </label>
                        <button
                          onClick={() => setUseRawJson(true)}
                          className="flex items-center gap-1 text-xs text-slate-dim hover:text-cyan"
                        >
                          <ToggleLeft className="h-3 w-3" />
                          Raw JSON
                        </button>
                      </div>
                      {typedParams.map((p) => (
                        <div key={p.name} className="space-y-1">
                          <label className="text-xs font-medium text-white flex items-center gap-1">
                            {p.name}
                            {p.required && (
                              <span className="text-red-400">*</span>
                            )}
                            <span className="text-slate-dim font-normal ml-1">
                              ({p.type})
                            </span>
                          </label>
                          {p.description && (
                            <p className="text-xs text-slate-dim">
                              {p.description}
                            </p>
                          )}
                          {p.type === 'boolean' ? (
                            <select
                              value={paramValues[p.name] ?? ''}
                              onChange={(e) => setParam(p.name, e.target.value)}
                              className="w-full bg-black/40 border border-white/[0.12] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan/50"
                            >
                              <option value="">-- select --</option>
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : (
                            <input
                              type={p.type === 'number' ? 'number' : 'text'}
                              value={paramValues[p.name] ?? ''}
                              onChange={(e) => setParam(p.name, e.target.value)}
                              placeholder={
                                p.type === 'object' ? 'JSON value' : undefined
                              }
                              className="w-full bg-black/40 border border-white/[0.12] rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan/50"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Execute */}
                <Button
                  onClick={executeTool}
                  disabled={loading}
                  className="bg-cyan hover:bg-cyan/80 text-black font-semibold"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute Tool
                </Button>
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <Card className="bg-white/[0.06] border border-red-500/50">
                <CardContent className="py-4">
                  <p className="text-sm text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Response */}
            {response !== null && (
              <Card className="bg-white/[0.06] border border-white/[0.12]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    Response
                    {responseTime !== null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                        {responseTime}ms
                      </span>
                    )}
                    <button
                      onClick={copyResponse}
                      className="ml-auto text-slate-dim hover:text-white transition-colors"
                      title="Copy response"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono text-slate-300 bg-black/40 rounded p-3 overflow-auto max-h-[400px] whitespace-pre-wrap">
                    {typeof response === 'string'
                      ? response
                      : JSON.stringify(response, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="bg-white/[0.06] border border-white/[0.12]">
            <CardContent className="py-16 text-center">
              <Cpu className="h-10 w-10 text-slate-dim mx-auto mb-3" />
              <p className="text-slate-dim text-sm mb-1">
                Select a tool from the left panel to get started
              </p>
              <p className="text-slate-dim/60 text-xs">
                Browse domains, search by name, or explore tool descriptions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
