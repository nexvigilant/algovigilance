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
      name: "classify",
      label: "Classify",
      description: "Classify a harm event by three binary attributes: multiplicity (single/multiple), temporal profile (acute/chronic), and ",
      params: ["multiplicity", "temporal", "determinism"],
    },
    {
      name: "catalog",
      label: "Catalog",
      description: "Return the complete catalog of all 8 harm types (A-H) with definitions, conservation laws violated, manifestation levels",
      params: [],
    },
    {
      name: "axiom-connection",
      label: "Axiom Connection",
      description: "Get the conservation law axiom connection for a specific harm type. Returns primary and secondary axioms violated, mecha",
      params: ["harm_type"],
    },
    {
      name: "manifestation-levels",
      label: "Manifestation Levels",
      description: "Get the hierarchy manifestation levels for a harm type. Returns the range of levels (1-8: Molecular to Population) where",
      params: ["harm_type"],
    },
    {
      name: "combinations",
      label: "Combinations",
      description: "List common harm type combinations that co-occur in clinical practice. Returns multi-type patterns with their frequency ",
      params: [],
    },
    {
      name: "verify-exhaustiveness",
      label: "Verify Exhaustiveness",
      description: "Verify that the 8-type taxonomy is exhaustive — that all 2³=8 combinations of the three binary characteristics are cover",
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
