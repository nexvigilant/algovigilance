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
      name: "measure-compare",
      label: "Measure Compare",
      description: "Compare two crates side-by-side: health scores, LOC ratio, test density diff.",
      params: [],
    },
    {
      name: "measure-crate",
      label: "Measure Crate",
      description: "Measure a single crate's health: LOC, test count, entropy, and composite score.",
      params: [],
    },
    {
      name: "measure-drift",
      label: "Measure Drift",
      description: "Detect statistically significant metric drift using Welch's t-test on history.",
      params: [],
    },
    {
      name: "measure-entropy",
      label: "Measure Entropy",
      description: "Compute Shannon entropy, max entropy, and redundancy from category counts.",
      params: [],
    },
    {
      name: "measure-graph",
      label: "Measure Graph",
      description: "Measure Graph",
      params: [],
    },
    {
      name: "measure-stats",
      label: "Measure Stats",
      description: "Compute statistical summary: mean, variance, 95% CI, and linear regression.",
      params: [],
    },
    {
      name: "measure-workspace",
      label: "Measure Workspace",
      description: "Measure Workspace",
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
