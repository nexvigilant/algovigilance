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
      name: "safety-margin",
      label: "Safety Margin",
      description: "Calculate safety margin distance d(s) — a weighted composite of four disproportionality metrics (PRR, ROR lower CI, IC02",
      params: ["prr", "ror_lower", "ic025", "eb05", "n"],
    },
    {
      name: "risk-score",
      label: "Risk Score",
      description: "Compute Guardian-AV risk score (0-10) for a drug-event pair from four disproportionality metrics and case count. Levels:",
      params: ["drug", "event", "prr", "ror_lower", "ic025", "eb05", "n"],
    },
    {
      name: "harm-types",
      label: "Harm Types",
      description: "List all 8 harm types (A-H) from the Theory of Vigilance §9. Types derive from three binary attributes: multiplicity (si",
      params: [],
    },
    {
      name: "harm-classify",
      label: "Harm Classify",
      description: "Classify an adverse drug reaction into a harm type (A-H) from three binary attributes per Theory of Vigilance §9. Exampl",
      params: ["multiplicity", "temporal", "determinism"],
    },
    {
      name: "map-to-tov",
      label: "Map To Tov",
      description: "Map a safety level (1-8) to its Theory of Vigilance abstraction tier. Levels: 1=Molecular, 2=Cellular, 3=Tissue, 4=Organ",
      params: ["level"],
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
