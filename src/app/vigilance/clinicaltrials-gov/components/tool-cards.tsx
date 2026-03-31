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
      name: "search-trials",
      label: "Search Trials",
      description: "Search clinical trials by drug, condition, sponsor, or status",
      params: ["query"],
    },
    {
      name: "get-trial",
      label: "Get Trial",
      description: "Get full trial record by NCT ID",
      params: ["nct_id"],
    },
    {
      name: "get-safety-endpoints",
      label: "Get Safety Endpoints",
      description: "Extract safety and adverse event endpoints from a trial's outcomes module",
      params: ["nct_id"],
    },
    {
      name: "get-serious-adverse-events",
      label: "Get Serious Adverse Events",
      description: "Get reported serious adverse events from trial results (requires posted results)",
      params: ["nct_id"],
    },
    {
      name: "compare-trial-arms",
      label: "Compare Trial Arms",
      description: "Compare adverse event rates between treatment and control arms (requires posted results)",
      params: ["nct_id"],
    },
    {
      name: "get-eligibility-criteria",
      label: "Get Eligibility Criteria",
      description: "Extract eligibility criteria (inclusion/exclusion), age range, sex, and healthy volunteer status from a trial",
      params: ["nct_id"],
    },
    {
      name: "get-study-design",
      label: "Get Study Design",
      description: "Extract study design details — randomization, blinding, masking, allocation, phases, enrollment, and arm count",
      params: ["nct_id"],
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
