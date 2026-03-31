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
      name: "causality-rucam",
      label: "Causality Rucam",
      description: "Score range: -4 to +14.",
      params: [],
    },
    {
      name: "causality-ucas",
      label: "Causality Ucas",
      description: "Score range: -3 to +14.",
      params: [],
    },
    {
      name: "crew-assign",
      label: "Crew Assign",
      description: "and computes DAG execution order.",
      params: [],
    },
    {
      name: "crew-fuse-decisions",
      label: "Crew Fuse Decisions",
      description: "- `unanimous`: All agents must agree",
      params: [],
    },
    {
      name: "crew-task-status",
      label: "Crew Task Status",
      description: "`crew_task_status` — check progress of a crew task.",
      params: [],
    },
    {
      name: "hitl-queue",
      label: "Hitl Queue",
      description: "Automatically expires stale entries.",
      params: [],
    },
    {
      name: "hitl-review",
      label: "Hitl Review",
      description: "Writes to append-only audit log.",
      params: [],
    },
    {
      name: "hitl-stats",
      label: "Hitl Stats",
      description: "/// Reports approval rates, review times, per-tool and per-reviewer breakdowns.",
      params: [],
    },
    {
      name: "hitl-submit",
      label: "Hitl Submit",
      description: "by risk level and score. Each entry has an expiration (default 72 hours).",
      params: [],
    },
    {
      name: "model-compare",
      label: "Model Compare",
      description: "Compare models for a specific task.",
      params: [],
    },
    {
      name: "model-list",
      label: "Model List",
      description: "List all available models.",
      params: [],
    },
    {
      name: "model-route",
      label: "Model Route",
      description: "Route a task to the optimal model.",
      params: [],
    },
    {
      name: "reason-counterfactual",
      label: "Reason Counterfactual",
      description: "Run counterfactual analysis: \"what if we remove node X?\"",
      params: [],
    },
    {
      name: "reason-infer",
      label: "Reason Infer",
      description: "Build a causal DAG and run inference to find chains and risk level.",
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
