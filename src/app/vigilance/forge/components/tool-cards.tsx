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
      name: "forge-atomize",
      label: "Forge Atomize",
      description: "structure with per-type counts, duration analysis, and edge breakdown.",
      params: [],
    },
    {
      name: "forge-code-generate",
      label: "Forge Code Generate",
      description: "Generate Rust code from collected primitives and defeated enemies.",
      params: [],
    },
    {
      name: "forge-compile",
      label: "Forge Compile",
      description: "`config.ts` and `index.ts`.",
      params: [],
    },
    {
      name: "forge-extract",
      label: "Forge Extract",
      description: "Cargo.toml, source files, and optionally applies a domain plugin.",
      params: [],
    },
    {
      name: "forge-graph",
      label: "Forge Graph",
      description: "overlap clusters, and the full graph structure.",
      params: [],
    },
    {
      name: "forge-init",
      label: "Forge Init",
      description: "Initialize a new Forge session",
      params: [],
    },
    {
      name: "forge-mine",
      label: "Forge Mine",
      description: "Mine primitives from a concept",
      params: [],
    },
    {
      name: "forge-nash-solve",
      label: "Forge Nash Solve",
      description: "Solve N×M mixed strategy Nash equilibrium via fictitious play.",
      params: [],
    },
    {
      name: "forge-payoff-matrix",
      label: "Forge Payoff Matrix",
      description: "Analyze an N×M payoff matrix: best responses, dominance, minimax.",
      params: [],
    },
    {
      name: "forge-prompt",
      label: "Forge Prompt",
      description: "Generate forge prompt for a task (now strategy-aware via session harness)",
      params: [],
    },
    {
      name: "forge-quality-score",
      label: "Forge Quality Score",
      description: "Compute forge quality score: Q = 0.40×prim + 0.25×combat + 0.20×turn + 0.15×survival",
      params: [],
    },
    {
      name: "forge-reference",
      label: "Forge Reference",
      description: "Get the primitive reference card",
      params: [],
    },
    {
      name: "forge-scaffold",
      label: "Forge Scaffold",
      description: "and TODO markers for narrative content.",
      params: [],
    },
    {
      name: "forge-schema",
      label: "Forge Schema",
      description: "Forge Schema",
      params: [],
    },
    {
      name: "forge-shortest-path",
      label: "Forge Shortest Path",
      description: "to reach a specific ALO or any ALO tagged with a specific KSB reference.",
      params: [],
    },
    {
      name: "forge-suggest",
      label: "Forge Suggest",
      description: "12,000 simulated games in the Primitive Depths genetic algorithm.",
      params: [],
    },
    {
      name: "forge-summary",
      label: "Forge Summary",
      description: "Get session summary",
      params: [],
    },
    {
      name: "forge-system-prompt",
      label: "Forge System Prompt",
      description: "Forge System Prompt",
      params: [],
    },
    {
      name: "forge-tier",
      label: "Forge Tier",
      description: "Forge Tier",
      params: [],
    },
    {
      name: "forge-validate",
      label: "Forge Validate",
      description: "use the vigilance domain IR for cross-referencing.",
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
