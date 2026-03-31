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
      name: "get-portfolio",
      label: "Get Portfolio",
      description: "Get AbbVie Inc. approved product portfolio — brand names, generics, routes, pharmacologic classes",
      params: [],
    },
    {
      name: "get-pipeline",
      label: "Get Pipeline",
      description: "Get AbbVie Inc. clinical trial pipeline — active and recruiting trials by phase",
      params: [],
    },
    {
      name: "get-safety-profile",
      label: "Get Safety Profile",
      description: "Get AbbVie Inc. aggregate safety profile from FAERS — top adverse reactions, outcomes, products with most reports",
      params: [],
    },
    {
      name: "get-recalls",
      label: "Get Recalls",
      description: "Get AbbVie Inc. product recalls and enforcement actions from FDA",
      params: [],
    },
    {
      name: "get-labeling-changes",
      label: "Get Labeling Changes",
      description: "Get recent safety labeling changes for AbbVie Inc. products",
      params: [],
    },
    {
      name: "search-products",
      label: "Search Products",
      description: "Search AbbVie Inc. products by keyword — drug name, condition, or therapeutic area",
      params: ["query"],
    },
    {
      name: "get-head-to-head",
      label: "Get Head To Head",
      description: "Compare AbbVie Inc. adverse event reporting vs a competitor using PRR from FAERS",
      params: ["competitor", "event"],
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
