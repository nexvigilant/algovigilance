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
      name: "get-working-groups",
      label: "Get Working Groups",
      description: "Get list of CIOMS working groups and their PV-related outputs",
      params: [],
    },
    {
      name: "get-cioms-form",
      label: "Get Cioms Form",
      description: "Get CIOMS I form field specifications for ICSR reporting",
      params: [],
    },
    {
      name: "search-publications",
      label: "Search Publications",
      description: "Search CIOMS publications on pharmacovigilance topics",
      params: ["query"],
    },
    {
      name: "get-seriousness-criteria",
      label: "Get Seriousness Criteria",
      description: "Get ICH E2A seriousness criteria for classifying adverse events as serious (death, life-threatening, hospitalization, di",
      params: [],
    },
    {
      name: "get-causality-categories",
      label: "Get Causality Categories",
      description: "Get WHO-UMC causality assessment categories (Certain, Probable, Possible, Unlikely, Conditional, Unassessable) with crit",
      params: [],
    },
    {
      name: "get-reporting-timelines",
      label: "Get Reporting Timelines",
      description: "Get expedited and periodic safety reporting timelines by region (US FDA, EU EMA, Japan PMDA, ICH harmonized) covering IC",
      params: [],
    },
    {
      name: "get-cioms-form-ii",
      label: "Get Cioms Form Ii",
      description: "Get CIOMS II line listing format for Periodic Safety Update Reports (PSURs) — standardized columns for tabulating indivi",
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
