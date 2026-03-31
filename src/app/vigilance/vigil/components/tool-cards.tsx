"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ToolDef {
  name: string
  label: string
  description: string
  params: string[]
}

const TOOLS: ToolDef[] = [
    {
      name: "vigil-authority-config",
      label: "Vigil Authority Config",
      description: "- list-config: Show complete authority configuration",
      params: [],
    },
    {
      name: "vigil-authority-verify",
      label: "Vigil Authority Verify",
      description: "- Preview token cost and latency",
      params: [],
    },
    {
      name: "vigil-context-assemble",
      label: "Vigil Context Assemble",
      description: "- Token budget and cost estimates",
      params: [],
    },
    {
      name: "vigil-emit-event",
      label: "Vigil Emit Event",
      description: "the appropriate action (InvokeClaude, QuickResponse, etc.)",
      params: [],
    },
    {
      name: "vigil-executor-control",
      label: "Vigil Executor Control",
      description: "- status: Check current executor configuration",
      params: [],
    },
    {
      name: "vigil-health",
      label: "Vigil Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "vigil-llm-stats",
      label: "Vigil Llm Stats",
      description: "- Provider and model info",
      params: [],
    },
    {
      name: "vigil-memory-search",
      label: "Vigil Memory Search",
      description: "Fallback: Keyword search across KSB filesystem (~/.claude/knowledge/, ~/.claude/brain/).",
      params: [],
    },
    {
      name: "vigil-memory-stats",
      label: "Vigil Memory Stats",
      description: "/// Returns collection info, point count, and indexing status.",
      params: [],
    },
    {
      name: "vigil-source-config",
      label: "Vigil Source Config",
      description: "- Filesystem: patterns, debounce, depth",
      params: [],
    },
    {
      name: "vigil-source-control",
      label: "Vigil Source Control",
      description: "- git_monitor: Git commit/push detection",
      params: [],
    },
    {
      name: "vigil-status",
      label: "Vigil Status",
      description: "Check PHAROS status: existing reports, timer state.",
      params: [],
    },
    {
      name: "vigil-sys-add-boundary",
      label: "Vigil Sys Add Boundary",
      description: "Add a boundary specification to the running daemon.",
      params: [],
    },
    {
      name: "vigil-sys-boundaries",
      label: "Vigil Sys Boundaries",
      description: "Vigil Sys Boundaries",
      params: [],
    },
    {
      name: "vigil-sys-ledger-query",
      label: "Vigil Sys Ledger Query",
      description: "Query ledger entries.",
      params: [],
    },
    {
      name: "vigil-sys-ledger-verify",
      label: "Vigil Sys Ledger Verify",
      description: "Vigil Sys Ledger Verify",
      params: [],
    },
    {
      name: "vigil-sys-start",
      label: "Vigil Sys Start",
      description: "Start the vigilance daemon.",
      params: [],
    },
    {
      name: "vigil-sys-stats",
      label: "Vigil Sys Stats",
      description: "Vigil Sys Stats",
      params: [],
    },
    {
      name: "vigil-sys-status",
      label: "Vigil Sys Status",
      description: "Vigil Sys Status",
      params: [],
    },
    {
      name: "vigil-sys-stop",
      label: "Vigil Sys Stop",
      description: "Vigil Sys Stop",
      params: [],
    },
    {
      name: "vigil-webhook-test",
      label: "Vigil Webhook Test",
      description: "- Security validation (no injection vectors)",
      params: [],
    }
]

export function ToolCards() {
  const [search, setSearch] = useState("")
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const filtered = TOOLS.filter(
    (t) =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search tools..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool) => (
          <Card
            key={tool.name}
            className={`cursor-pointer transition-colors hover:border-primary ${
              selectedTool === tool.name ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => setSelectedTool(tool.name === selectedTool ? null : tool.name)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                {tool.label}
              </CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {tool.params.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                ))}
                {tool.params.length === 0 && (
                  <Badge variant="outline" className="text-xs">no params</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No tools match your search.
        </p>
      )}
    </div>
  )
}
