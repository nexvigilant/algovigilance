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
      name: "faers-compare-drugs",
      label: "Faers Compare Drugs",
      description: "O(n²) - set intersection/difference on bounded top_n ≤ 50 events",
      params: [],
    },
    {
      name: "faers-disproportionality",
      label: "Faers Disproportionality",
      description: "and a custody chain stamp from this MCP station.",
      params: [],
    },
    {
      name: "faers-drug-events",
      label: "Faers Drug Events",
      description: "Get top adverse events for a drug",
      params: [],
    },
    {
      name: "faers-etl-known-pairs",
      label: "Faers Etl Known Pairs",
      description: "Validate known drug-event pairs against local FAERS data.",
      params: [],
    },
    {
      name: "faers-etl-run",
      label: "Faers Etl Run",
      description: "Run full L1-L5 validation",
      params: [],
    },
    {
      name: "faers-etl-signals",
      label: "Faers Etl Signals",
      description: "Search FAERS ETL signals by drug and/or event name.",
      params: [],
    },
    {
      name: "faers-etl-status",
      label: "Faers Etl Status",
      description: "Check PHAROS status: existing reports, timer state.",
      params: [],
    },
    {
      name: "faers-geographic-divergence",
      label: "Faers Geographic Divergence",
      description: "Faers Geographic Divergence",
      params: [],
    },
    {
      name: "faers-outcome-conditioned",
      label: "Faers Outcome Conditioned",
      description: "Compute outcome-conditioned signals (Algorithm A82).",
      params: [],
    },
    {
      name: "faers-polypharmacy",
      label: "Faers Polypharmacy",
      description: "Compute polypharmacy interaction signals (Algorithm A78).",
      params: [],
    },
    {
      name: "faers-reporter-weighted",
      label: "Faers Reporter Weighted",
      description: "Compute reporter-weighted signals (Algorithm A79).",
      params: [],
    },
    {
      name: "faers-search",
      label: "Faers Search",
      description: "Search documents by query string",
      params: [],
    },
    {
      name: "faers-seriousness-cascade",
      label: "Faers Seriousness Cascade",
      description: "Compute seriousness cascades (Algorithm A80).",
      params: [],
    },
    {
      name: "faers-signal-check",
      label: "Faers Signal Check",
      description: "Check FDA signal for drug-event pair.",
      params: [],
    },
    {
      name: "faers-signal-velocity",
      label: "Faers Signal Velocity",
      description: "Compute signal velocities (Algorithm A77).",
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
