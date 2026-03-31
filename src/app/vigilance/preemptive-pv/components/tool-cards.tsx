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
      name: "reactive",
      label: "Reactive",
      description: "Tier 1: Standard reactive signal detection from a 2x2 contingency table. Returns PRR, chi-squared, and detection verdict",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "predictive",
      label: "Predictive",
      description: "Tier 2: Severity-weighted predictive detection. Multiplies PRR by seriousness omega weight (ICH E2A criteria). More seri",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "gibbs",
      label: "Gibbs",
      description: "Tier 3: Preemptive detection via Gibbs free energy thermodynamic model. Negative delta-G = spontaneous signal (drug-even",
      params: ["prr", "n"],
    },
    {
      name: "evaluate",
      label: "Evaluate",
      description: "Full three-tier evaluation: runs reactive, predictive, AND preemptive detection in one call. Returns results from all ti",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "trajectory",
      label: "Trajectory",
      description: "Trajectory amplification: detect accelerating reporting trends using Hill curve amplification on time-series data. Repor",
      params: ["data"],
    },
    {
      name: "severity",
      label: "Severity",
      description: "Get the severity weight (omega) for a seriousness level. Returns the ICH E2A-based weight used in predictive and preempt",
      params: ["seriousness"],
    },
    {
      name: "noise",
      label: "Noise",
      description: "Noise floor correction: compute corrected signal by subtracting background noise and testing statistical significance.",
      params: ["observed", "background"],
    },
    {
      name: "intervention",
      label: "Intervention",
      description: "Model competitive inhibition intervention: compute residual signal after applying an intervention of given strength. Bas",
      params: ["signal_strength", "intervention_strength"],
    },
    {
      name: "required-strength",
      label: "Required Strength",
      description: "Compute the intervention strength needed to achieve a target signal reduction.",
      params: ["signal_strength"],
    },
    {
      name: "omega-table",
      label: "Omega Table",
      description: "Reference table of all seriousness omega weights used in predictive and preemptive tiers.",
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
