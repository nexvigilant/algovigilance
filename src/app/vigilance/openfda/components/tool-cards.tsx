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
      name: "openfda-device-events",
      label: "Openfda Device Events",
      description: "Search medical device adverse event reports (MDR).",
      params: [],
    },
    {
      name: "openfda-device-recalls",
      label: "Openfda Device Recalls",
      description: "Openfda Device Recalls",
      params: [],
    },
    {
      name: "openfda-drug-events",
      label: "Openfda Drug Events",
      description: "Search drug adverse event reports from FAERS.",
      params: [],
    },
    {
      name: "openfda-drug-labels",
      label: "Openfda Drug Labels",
      description: "Search drug product labels (SPL).",
      params: [],
    },
    {
      name: "openfda-drug-ndc",
      label: "Openfda Drug Ndc",
      description: "Search National Drug Code directory.",
      params: [],
    },
    {
      name: "openfda-drug-recalls",
      label: "Openfda Drug Recalls",
      description: "Search drug recall enforcement actions.",
      params: [],
    },
    {
      name: "openfda-drugs-at-fda",
      label: "Openfda Drugs At Fda",
      description: "Search Drugs@FDA applications (NDA/BLA/ANDA).",
      params: [],
    },
    {
      name: "openfda-fan-out",
      label: "Openfda Fan Out",
      description: "Fan-out search across all major OpenFDA endpoints simultaneously.",
      params: [],
    },
    {
      name: "openfda-food-events",
      label: "Openfda Food Events",
      description: "Search food adverse event reports (CAERS).",
      params: [],
    },
    {
      name: "openfda-food-recalls",
      label: "Openfda Food Recalls",
      description: "Search food recall enforcement actions.",
      params: [],
    },
    {
      name: "openfda-substances",
      label: "Openfda Substances",
      description: "Search FDA substance registry.",
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
