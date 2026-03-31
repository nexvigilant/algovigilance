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
      name: "foundation-concept-grep",
      label: "Foundation Concept Grep",
      description: "Deterministic concept expansion for multi-variant search",
      params: [],
    },
    {
      name: "foundation-domain-distance",
      label: "Foundation Domain Distance",
      description: "/// distance = 1 - (w1 × T1_overlap + w2 × T2_overlap + w3 × T3_overlap)",
      params: [],
    },
    {
      name: "foundation-flywheel-velocity",
      label: "Foundation Flywheel Velocity",
      description: "velocity = 1 / avg(fix_time - failure_time) in events per millisecond.",
      params: [],
    },
    {
      name: "foundation-fsrs-review",
      label: "Foundation Fsrs Review",
      description: "FSRS spaced repetition review",
      params: [],
    },
    {
      name: "foundation-fuzzy-search",
      label: "Foundation Fuzzy Search",
      description: "Batch fuzzy search",
      params: [],
    },
    {
      name: "foundation-graph-levels",
      label: "Foundation Graph Levels",
      description: "Compute parallel execution levels",
      params: [],
    },
    {
      name: "foundation-graph-topsort",
      label: "Foundation Graph Topsort",
      description: "Topological sort",
      params: [],
    },
    {
      name: "foundation-levenshtein",
      label: "Foundation Levenshtein",
      description: "This tool is retained for backward compatibility.",
      params: [],
    },
    {
      name: "foundation-levenshtein-bounded",
      label: "Foundation Levenshtein Bounded",
      description: "Foundation Levenshtein Bounded",
      params: [],
    },
    {
      name: "foundation-sha256",
      label: "Foundation Sha256",
      description: "SHA-256 hash",
      params: [],
    },
    {
      name: "foundation-spectral-overlap",
      label: "Foundation Spectral Overlap",
      description: "For autocorrelation spectra, values are typically in [0, 1].",
      params: [],
    },
    {
      name: "foundation-token-ratio",
      label: "Foundation Token Ratio",
      description: "Lower is better — 0.33 means 3 operations per token.",
      params: [],
    },
    {
      name: "foundation-yaml-parse",
      label: "Foundation Yaml Parse",
      description: "Parse YAML to JSON",
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
