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
      name: "search-adverse-events",
      label: "Search Adverse Events",
      description: "Search FAERS adverse event reports by drug, reaction, or outcome",
      params: ["drug_name"],
    },
    {
      name: "get-drug-counts",
      label: "Get Drug Counts",
      description: "Get adverse event counts for a specific drug",
      params: ["drug_name"],
    },
    {
      name: "get-event-outcomes",
      label: "Get Event Outcomes",
      description: "Get outcome breakdown (death, hospitalization, disability) for a drug's FAERS reports with seriousness percentages",
      params: ["drug_name"],
    },
    {
      name: "get-event-timeline",
      label: "Get Event Timeline",
      description: "Get FAERS report counts by date for trend detection — enables signal velocity analysis",
      params: ["drug_name"],
    },
    {
      name: "get-reporter-breakdown",
      label: "Get Reporter Breakdown",
      description: "Get reporter qualification breakdown (physician, pharmacist, consumer, etc.) for signal quality weighting",
      params: ["drug_name"],
    },
    {
      name: "get-drug-characterization",
      label: "Get Drug Characterization",
      description: "Get how often a drug is suspect vs concomitant vs interacting in FAERS — feeds causality weighting",
      params: ["drug_name"],
    },
    {
      name: "get-indication-counts",
      label: "Get Indication Counts",
      description: "Get top indications (reasons for use) from FAERS — detects off-label use patterns",
      params: ["drug_name"],
    },
    {
      name: "get-top-drugs",
      label: "Get Top Drugs",
      description: "Get top N drugs by FAERS adverse event report count in a date range. Answers 'which drugs had the most reports last quar",
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
