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
      name: "telemetry-by-tool",
      label: "Telemetry By Tool",
      description: "/// Returns call count, success rate, duration percentiles, and byte totals.",
      params: [],
    },
    {
      name: "telemetry-governance-crossref",
      label: "Telemetry Governance Crossref",
      description: "Telemetry Governance Crossref",
      params: [],
    },
    {
      name: "telemetry-intel-report",
      label: "Telemetry Intel Report",
      description: "to produce a comprehensive intelligence report.",
      params: [],
    },
    {
      name: "telemetry-recent",
      label: "Telemetry Recent",
      description: "/// Returns the most recent operations across all telemetry sources.",
      params: [],
    },
    {
      name: "telemetry-slow-calls",
      label: "Telemetry Slow Calls",
      description: "/// Returns a list of slow calls sorted by duration (descending).",
      params: [],
    },
    {
      name: "telemetry-snapshot-evolution",
      label: "Telemetry Snapshot Evolution",
      description: "version evolution over time.",
      params: [],
    },
    {
      name: "telemetry-source-analyze",
      label: "Telemetry Source Analyze",
      description: "file access patterns, and token usage.",
      params: [],
    },
    {
      name: "telemetry-sources-list",
      label: "Telemetry Sources List",
      description: "metadata about each discovered source.",
      params: [],
    },
    {
      name: "telemetry-summary",
      label: "Telemetry Summary",
      description: "/// Returns total calls, success/failure counts, duration stats, and byte totals.",
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
