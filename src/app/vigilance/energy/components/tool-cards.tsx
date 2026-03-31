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
      name: "compute_energy_charge",
      label: "Compute_Energy_Charge",
      description: "Compute the Atkinson Energy Charge (EC) from token pools. EC = (tATP + 0.5*tADP) / (tATP + tADP + tAMP). Returns EC, reg",
      params: ["t_atp", "t_adp", "t_amp"],
    },
    {
      name: "classify_regime",
      label: "Classify_Regime",
      description: "Classify an energy charge value into a metabolic regime. Anabolic (>0.85), Homeostatic (0.70-0.85), Catabolic (0.50-0.70",
      params: ["energy_charge"],
    },
    {
      name: "recommend_strategy",
      label: "Recommend_Strategy",
      description: "Given token pools and a coupling ratio, recommend a model strategy (Opus/Sonnet/Haiku/HaikuCacheFirst/Checkpoint).",
      params: ["t_atp", "t_adp", "t_amp"],
    },
    {
      name: "analyze_waste",
      label: "Analyze_Waste",
      description: "Analyze token waste metrics: waste ratio, burn rate, lifespan efficiency, and estimated remaining operations.",
      params: ["t_atp", "t_adp", "t_amp"],
    },
    {
      name: "temporal_metrics",
      label: "Temporal_Metrics",
      description: "Compute temporal view of energy: metabolic age, chronological age, age gap, and conservation breakdown (future + time + ",
      params: ["t_atp", "t_adp", "t_amp"],
    },
    {
      name: "classify_waste",
      label: "Classify_Waste",
      description: "Classify a waste event into one of 5 categories with prevention strategy. Categories: FutileCycling, Uncoupled, HeatLoss",
      params: ["waste_type"],
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
