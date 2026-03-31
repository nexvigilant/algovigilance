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
      description: "Search VigiBase reports by medicine name",
      params: ["medicine"],
    },
    {
      name: "get-adverse-reactions",
      label: "Get Adverse Reactions",
      description: "Get adverse reaction breakdown by SOC for a medicine",
      params: ["medicine"],
    },
    {
      name: "get-reporter-distribution",
      label: "Get Reporter Distribution",
      description: "Get report distribution by reporter type (healthcare professional, consumer, etc.)",
      params: ["medicine"],
    },
    {
      name: "get-age-distribution",
      label: "Get Age Distribution",
      description: "Get case distribution by patient age group",
      params: ["medicine"],
    },
    {
      name: "get-region-distribution",
      label: "Get Region Distribution",
      description: "Get geographic distribution of reports by WHO region",
      params: ["medicine"],
    },
    {
      name: "get-sex-distribution",
      label: "Get Sex Distribution",
      description: "Get report distribution by patient sex (male, female, unknown)",
      params: ["medicine"],
    },
    {
      name: "get-year-distribution",
      label: "Get Year Distribution",
      description: "Get report distribution by reporting year for temporal trend analysis",
      params: ["medicine"],
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
