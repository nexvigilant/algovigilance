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
      name: "compute-disproportionality",
      label: "Compute Disproportionality",
      description: "Compute PRR, ROR, and IC for a drug-event combination using FAERS data",
      params: ["drug", "event"],
    },
    {
      name: "get-top-reactions",
      label: "Get Top Reactions",
      description: "Get top adverse reactions for a drug ranked by disproportionality score",
      params: ["drug"],
    },
    {
      name: "get-top-drugs",
      label: "Get Top Drugs",
      description: "Get top drugs associated with a specific adverse event",
      params: ["event"],
    },
    {
      name: "get-case-demographics",
      label: "Get Case Demographics",
      description: "Get demographic breakdown of cases for a drug-event pair",
      params: ["drug"],
    },
    {
      name: "compare-drugs",
      label: "Compare Drugs",
      description: "Compare disproportionality scores between two drugs for the same adverse event",
      params: ["drug_a", "drug_b", "event"],
    },
    {
      name: "get-reporting-trends",
      label: "Get Reporting Trends",
      description: "Get annual reporting trends for a drug-event combination — detect emerging signals",
      params: ["drug"],
    },
    {
      name: "get-outcome-distribution",
      label: "Get Outcome Distribution",
      description: "Get patient outcome distribution — death, hospitalization, life-threatening for seriousness assessment",
      params: ["drug"],
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
