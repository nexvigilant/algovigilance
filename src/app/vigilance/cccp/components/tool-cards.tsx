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
      name: "gap-analysis",
      label: "Gap Analysis",
      description: "Compute gap analysis from current and desired proficiency levels across 15 PV domains. Returns domains with gaps, blocke",
      params: ["current", "desired"],
    },
    {
      name: "plan",
      label: "Plan",
      description: "Generate an engagement plan with prioritized interventions to close proficiency gaps. Returns interventions with target ",
      params: ["current", "desired"],
    },
    {
      name: "epa-readiness",
      label: "Epa Readiness",
      description: "Check readiness for all 21 Entrustable Professional Activities given current proficiency levels. Returns ready and block",
      params: ["current"],
    },
    {
      name: "evaluate",
      label: "Evaluate",
      description: "Evaluate how many of the 15 PV domains meet a target proficiency level. Returns domains at/above target and overall read",
      params: ["current"],
    },
    {
      name: "phase-info",
      label: "Phase Info",
      description: "Get information about the 4 CCCP phases: Assessment, Planning, Development, Evaluation. Filter by phase name or get all.",
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
