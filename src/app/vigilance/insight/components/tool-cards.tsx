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
      name: "insight-compress",
      label: "Insight Compress",
      description: "/// Tier: T2-C (N + μ + κ — quantity reduction via mapping and comparison)",
      params: [],
    },
    {
      name: "insight-compress-auto",
      label: "Insight Compress Auto",
      description: "/// Tier: T2-C (N + μ + κ — automatic quantity reduction via clustering)",
      params: [],
    },
    {
      name: "insight-config",
      label: "Insight Config",
      description: "/// Tier: T2-P (∂ + ς — boundary configuration + state persistence)",
      params: [],
    },
    {
      name: "insight-connect",
      label: "Insight Connect",
      description: "/// Tier: T2-C (μ + κ + ς — mapping + comparison + state)",
      params: [],
    },
    {
      name: "insight-ingest",
      label: "Insight Ingest",
      description: "/// Tier: T3 (orchestrates all 6 composites via the Insight trait)",
      params: [],
    },
    {
      name: "insight-novelties",
      label: "Insight Novelties",
      description: "/// Tier: T2-C (∅ + ∃ + σ — void/existence detection in sequence)",
      params: [],
    },
    {
      name: "insight-patterns",
      label: "Insight Patterns",
      description: "/// Tier: T2-C (σ + κ + μ — sequence co-occurrence via comparison and mapping)",
      params: [],
    },
    {
      name: "insight-query",
      label: "Insight Query",
      description: "/// Tier: T2-C (κ + μ + σ — comparison-filtered query)",
      params: [],
    },
    {
      name: "insight-reset",
      label: "Insight Reset",
      description: "/// Tier: T1 (∅ — Void / clearing state)",
      params: [],
    },
    {
      name: "insight-status",
      label: "Insight Status",
      description: "/// Tier: T2-C (ς + N — state query + quantity)",
      params: [],
    },
    {
      name: "insight-system-ingest",
      label: "Insight System Ingest",
      description: "/// Tier: T3 (full pipeline through unified engine)",
      params: [],
    },
    {
      name: "insight-system-register",
      label: "Insight System Register",
      description: "/// Tier: T2-P (λ + ∃ — location + existence)",
      params: [],
    },
    {
      name: "insight-system-reset",
      label: "Insight System Reset",
      description: "/// Tier: T1 (∅ — Void / clearing state)",
      params: [],
    },
    {
      name: "insight-system-status",
      label: "Insight System Status",
      description: "/// Tier: T2-C (ς + N + Σ — state query + quantity + aggregation)",
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
