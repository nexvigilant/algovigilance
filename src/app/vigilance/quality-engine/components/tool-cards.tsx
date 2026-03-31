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
      name: "quality-gradient",
      label: "Quality Gradient",
      description: "/// T1 grounding: ∇ = →(Causality) + κ(Comparison) + ∂(Boundary)",
      params: [],
    },
    {
      name: "rank-fusion-borda",
      label: "Rank Fusion Borda",
      description: "Simple but effective when rankings have different scales.",
      params: [],
    },
    {
      name: "rank-fusion-hybrid",
      label: "Rank Fusion Hybrid",
      description: "`final(d) = α × dense(d) + (1-α) × normalized_sparse(d)`",
      params: [],
    },
    {
      name: "rank-fusion-rrf",
      label: "Rank Fusion Rrf",
      description: "Default k=60 (Cormack et al., 2009). Robust across diverse ranking systems.",
      params: [],
    },
    {
      name: "rate-limit-sliding-window",
      label: "Rate Limit Sliding Window",
      description: "Rate Limit Sliding Window",
      params: [],
    },
    {
      name: "rate-limit-status",
      label: "Rate Limit Status",
      description: "/// Returns current state of all or specific buckets/windows.",
      params: [],
    },
    {
      name: "rate-limit-token-bucket",
      label: "Rate Limit Token Bucket",
      description: "Tokens regenerate continuously over time.",
      params: [],
    },
    {
      name: "validify-gate",
      label: "Validify Gate",
      description: "Run a single gate.",
      params: [],
    },
    {
      name: "validify-gates-list",
      label: "Validify Gates List",
      description: "List all gate definitions.",
      params: [],
    },
    {
      name: "validify-run",
      label: "Validify Run",
      description: "Run full L1-L5 validation",
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
