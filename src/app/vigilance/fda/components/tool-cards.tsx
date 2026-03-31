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
      name: "fda-assess-risk",
      label: "Fda Assess Risk",
      description: "Fda Assess Risk",
      params: [],
    },
    {
      name: "fda-bridge-batch",
      label: "Fda Bridge Batch",
      description: "Batch evaluate multiple drug-event pairs through the FDA Data Bridge",
      params: [],
    },
    {
      name: "fda-bridge-evaluate",
      label: "Fda Bridge Evaluate",
      description: "Evaluate a drug-event pair through the FDA Data Bridge",
      params: [],
    },
    {
      name: "fda-calculate-score",
      label: "Fda Calculate Score",
      description: "Fda Calculate Score",
      params: [],
    },
    {
      name: "fda-create-plan",
      label: "Fda Create Plan",
      description: "Fda Create Plan",
      params: [],
    },
    {
      name: "fda-decide-adequacy",
      label: "Fda Decide Adequacy",
      description: "Fda Decide Adequacy",
      params: [],
    },
    {
      name: "fda-define-cou",
      label: "Fda Define Cou",
      description: "Fda Define Cou",
      params: [],
    },
    {
      name: "fda-drift-trend",
      label: "Fda Drift Trend",
      description: "Fda Drift Trend",
      params: [],
    },
    {
      name: "fda-evidence-distribution",
      label: "Fda Evidence Distribution",
      description: "Fda Evidence Distribution",
      params: [],
    },
    {
      name: "fda-guidance-categories",
      label: "Fda Guidance Categories",
      description: "Fda Guidance Categories",
      params: [],
    },
    {
      name: "fda-guidance-get",
      label: "Fda Guidance Get",
      description: "Get a specific hormone level",
      params: [],
    },
    {
      name: "fda-guidance-search",
      label: "Fda Guidance Search",
      description: "Search documents by query string",
      params: [],
    },
    {
      name: "fda-guidance-status",
      label: "Fda Guidance Status",
      description: "Check PHAROS status: existing reports, timer state.",
      params: [],
    },
    {
      name: "fda-guidance-url",
      label: "Fda Guidance Url",
      description: "Get URL for a guideline",
      params: [],
    },
    {
      name: "fda-metrics-summary",
      label: "Fda Metrics Summary",
      description: "Fda Metrics Summary",
      params: [],
    },
    {
      name: "fda-rating-thresholds",
      label: "Fda Rating Thresholds",
      description: "Fda Rating Thresholds",
      params: [],
    },
    {
      name: "fda-risk-distribution",
      label: "Fda Risk Distribution",
      description: "Fda Risk Distribution",
      params: [],
    },
    {
      name: "fda-validate-evidence",
      label: "Fda Validate Evidence",
      description: "Fda Validate Evidence",
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
