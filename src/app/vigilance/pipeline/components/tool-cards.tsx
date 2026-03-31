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
      name: "pipeline-batch-compute",
      label: "Pipeline Batch Compute",
      description: "Batch compute disproportionality metrics for multiple drug-event pairs.",
      params: [],
    },
    {
      name: "pipeline-compute-all",
      label: "Pipeline Compute All",
      description: "a 2x2 contingency table.",
      params: [],
    },
    {
      name: "pipeline-detect",
      label: "Pipeline Detect",
      description: "Detect a signal for a drug-event pair with configurable thresholds.",
      params: [],
    },
    {
      name: "pipeline-primitives",
      label: "Pipeline Primitives",
      description: "Get the crate's T1 primitive manifest.",
      params: [],
    },
    {
      name: "pipeline-relay-chain",
      label: "Pipeline Relay Chain",
      description: "Get the PV pipeline relay chain with fidelity per stage.",
      params: [],
    },
    {
      name: "pipeline-report",
      label: "Pipeline Report",
      description: "Generate a signal detection report from batch data.",
      params: [],
    },
    {
      name: "pipeline-thresholds",
      label: "Pipeline Thresholds",
      description: "Get threshold configurations (Evans, strict, sensitive).",
      params: [],
    },
    {
      name: "pipeline-transfer",
      label: "Pipeline Transfer",
      description: "Look up cross-domain transfer mappings for signal-pipeline types.",
      params: [],
    },
    {
      name: "pipeline-validate",
      label: "Pipeline Validate",
      description: "Validate a detection result against multiple quality checks.",
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
