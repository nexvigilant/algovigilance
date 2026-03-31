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
      name: "drift-detect",
      label: "Drift Detect",
      description: "drift from stable — `Result::is_ok()` is always true for well-formed inputs.",
      params: [],
    },
    {
      name: "drift-jsd",
      label: "Drift Jsd",
      description: "distributions; near 1 indicates maximally different.",
      params: [],
    },
    {
      name: "drift-ks-test",
      label: "Drift Ks Test",
      description: "(max CDF difference) and approximate p-value. Drift detected if p < alpha.",
      params: [],
    },
    {
      name: "drift-psi",
      label: "Drift Psi",
      description: "- > 0.25: Significant shift (action required)",
      params: [],
    },
    {
      name: "monitoring-alerts",
      label: "Monitoring Alerts",
      description: "`monitoring_alerts` — filtered alert list by severity.",
      params: [],
    },
    {
      name: "monitoring-health-check",
      label: "Monitoring Health Check",
      description: "Monitoring Health Check",
      params: [],
    },
    {
      name: "monitoring-hook-health",
      label: "Monitoring Hook Health",
      description: "`monitoring_hook_health` — deep analysis for a specific hook or all hooks.",
      params: [],
    },
    {
      name: "monitoring-signal-digest",
      label: "Monitoring Signal Digest",
      description: "`monitoring_signal_digest` — signal groups by type/priority.",
      params: [],
    },
    {
      name: "observability-freshness",
      label: "Observability Freshness",
      description: "a maximum acceptable age (SLA). Flags stale sources.",
      params: [],
    },
    {
      name: "observability-query",
      label: "Observability Query",
      description: "for a specific endpoint or all endpoints.",
      params: [],
    },
    {
      name: "observability-record-latency",
      label: "Observability Record Latency",
      description: "Observability Record Latency",
      params: [],
    },
    {
      name: "sentinel-check-ip",
      label: "Sentinel Check Ip",
      description: "Check if an IP address would be whitelisted by sentinel.",
      params: [],
    },
    {
      name: "sentinel-config-defaults",
      label: "Sentinel Config Defaults",
      description: "Return annotated default configuration with descriptions for each field.",
      params: [],
    },
    {
      name: "sentinel-parse-line",
      label: "Sentinel Parse Line",
      description: "Parse a syslog auth line into a structured AuthEvent.",
      params: [],
    },
    {
      name: "sentinel-status",
      label: "Sentinel Status",
      description: "Sentinel Status",
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
