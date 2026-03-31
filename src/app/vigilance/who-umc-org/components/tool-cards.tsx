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
      name: "get-signal-methodology",
      label: "Get Signal Methodology",
      description: "Get WHO-UMC signal detection methodology and vigiRank description",
      params: [],
    },
    {
      name: "search-vigibase",
      label: "Search Vigibase",
      description: "Search VigiBase for global ICSR data",
      params: ["substance"],
    },
    {
      name: "get-causality-assessment",
      label: "Get Causality Assessment",
      description: "Get WHO-UMC causality assessment criteria and categories",
      params: [],
    },
    {
      name: "get-country-programs",
      label: "Get Country Programs",
      description: "Get list of national PV centres and their WHO Programme membership",
      params: [],
    },
    {
      name: "get-naranjo-algorithm",
      label: "Get Naranjo Algorithm",
      description: "Get the Naranjo ADR Probability Scale — 10 questions with scoring criteria for causality assessment",
      params: [],
    },
    {
      name: "get-ic-computation",
      label: "Get Ic Computation",
      description: "Get Information Component (IC) computation methodology with worked example — Bayesian signal detection metric used in Vi",
      params: [],
    },
    {
      name: "get-adverse-reaction-terminology",
      label: "Get Adverse Reaction Terminology",
      description: "Get WHO Adverse Reaction Terminology (WHO-ART) hierarchy description — legacy coding system with 4 levels",
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
