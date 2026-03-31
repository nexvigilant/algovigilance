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
      name: "get-drug-info",
      label: "Get Drug Info",
      description: "Get comprehensive drug profile including pharmacology and mechanism",
      params: ["drug_name"],
    },
    {
      name: "get-interactions",
      label: "Get Interactions",
      description: "Get drug-drug interactions with mechanism descriptions",
      params: ["drug_name"],
    },
    {
      name: "get-pharmacology",
      label: "Get Pharmacology",
      description: "Get pharmacokinetics and pharmacodynamics data",
      params: ["drug_name"],
    },
    {
      name: "get-targets",
      label: "Get Targets",
      description: "Get drug targets (enzymes, transporters, carriers)",
      params: ["drug_name"],
    },
    {
      name: "get-adverse-effects",
      label: "Get Adverse Effects",
      description: "Get known adverse effects with frequency data",
      params: ["drug_name"],
    },
    {
      name: "get-classification",
      label: "Get Classification",
      description: "Get drug classification — pharmacologic class, mechanism of action, ATC codes, product type, route, and dosage form",
      params: ["drug_name"],
    },
    {
      name: "get-contraindications",
      label: "Get Contraindications",
      description: "Get contraindications, boxed warnings, warnings/precautions, pregnancy, pediatric, and geriatric use information",
      params: ["drug_name"],
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
