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
      name: "search-reports",
      label: "Search Reports",
      description: "Search EudraVigilance line listings by substance and reaction",
      params: ["substance"],
    },
    {
      name: "get-signal-summary",
      label: "Get Signal Summary",
      description: "Get disproportionality signal summary (ROR) for a substance-reaction pair",
      params: ["substance", "reaction"],
    },
    {
      name: "get-case-counts",
      label: "Get Case Counts",
      description: "Get total ICSR counts by substance with breakdown by seriousness and outcome",
      params: ["substance"],
    },
    {
      name: "get-geographical-distribution",
      label: "Get Geographical Distribution",
      description: "Get case count distribution by EEA country",
      params: ["substance"],
    },
    {
      name: "get-soc-breakdown",
      label: "Get Soc Breakdown",
      description: "Get System Organ Class breakdown of adverse reactions for a substance",
      params: ["substance"],
    },
    {
      name: "get-reporter-breakdown",
      label: "Get Reporter Breakdown",
      description: "Get reporter qualification breakdown — healthcare professional vs consumer reports",
      params: ["substance"],
    },
    {
      name: "get-age-sex-distribution",
      label: "Get Age Sex Distribution",
      description: "Get age group and sex demographic distribution for a substance",
      params: ["substance"],
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
