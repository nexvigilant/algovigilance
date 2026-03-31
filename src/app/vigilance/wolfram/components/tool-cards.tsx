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
      name: "wolfram-astronomy",
      label: "Wolfram Astronomy",
      description: "Query astronomical data",
      params: [],
    },
    {
      name: "wolfram-calculate",
      label: "Wolfram Calculate",
      description: "Perform mathematical calculation - extracts priority pods",
      params: [],
    },
    {
      name: "wolfram-chemistry",
      label: "Wolfram Chemistry",
      description: "Look up chemical compound information",
      params: [],
    },
    {
      name: "wolfram-convert",
      label: "Wolfram Convert",
      description: "Convert between units",
      params: [],
    },
    {
      name: "wolfram-data-lookup",
      label: "Wolfram Data Lookup",
      description: "Look up real-world data",
      params: [],
    },
    {
      name: "wolfram-datetime",
      label: "Wolfram Datetime",
      description: "Calculate dates, times, and durations",
      params: [],
    },
    {
      name: "wolfram-finance",
      label: "Wolfram Finance",
      description: "Financial calculations and data",
      params: [],
    },
    {
      name: "wolfram-image-result",
      label: "Wolfram Image Result",
      description: "Get visual/image result",
      params: [],
    },
    {
      name: "wolfram-linguistics",
      label: "Wolfram Linguistics",
      description: "Language and word information",
      params: [],
    },
    {
      name: "wolfram-nutrition",
      label: "Wolfram Nutrition",
      description: "Look up nutritional information",
      params: [],
    },
    {
      name: "wolfram-physics",
      label: "Wolfram Physics",
      description: "Query physics constants and calculations",
      params: [],
    },
    {
      name: "wolfram-plot",
      label: "Wolfram Plot",
      description: "Generate mathematical plot",
      params: [],
    },
    {
      name: "wolfram-query",
      label: "Wolfram Query",
      description: "Raw SQL query (read-only, max 100 rows).",
      params: [],
    },
    {
      name: "wolfram-query-filtered",
      label: "Wolfram Query Filtered",
      description: "Query with pod filtering",
      params: [],
    },
    {
      name: "wolfram-query-with-assumption",
      label: "Wolfram Query With Assumption",
      description: "Wolfram Query With Assumption",
      params: [],
    },
    {
      name: "wolfram-short-answer",
      label: "Wolfram Short Answer",
      description: "Get concise single-line answer",
      params: [],
    },
    {
      name: "wolfram-spoken-answer",
      label: "Wolfram Spoken Answer",
      description: "Get natural language answer",
      params: [],
    },
    {
      name: "wolfram-statistics",
      label: "Wolfram Statistics",
      description: "Perform statistical analysis",
      params: [],
    },
    {
      name: "wolfram-step-by-step",
      label: "Wolfram Step By Step",
      description: "Solve with step-by-step explanations",
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
