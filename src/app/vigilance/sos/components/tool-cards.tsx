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
      name: "sos-audit",
      label: "Sos Audit",
      description: "Get irreversibility audit trail (Layer 14: ∝ Irreversibility).",
      params: [],
    },
    {
      name: "sos-create",
      label: "Sos Create",
      description: "/// Returns the machine ID on success.",
      params: [],
    },
    {
      name: "sos-cycles",
      label: "Sos Cycles",
      description: "Detect cycles in machine transition graph (Layer 7: ρ Recursion).",
      params: [],
    },
    {
      name: "sos-history",
      label: "Sos History",
      description: "Get transition history for a machine.",
      params: [],
    },
    {
      name: "sos-list",
      label: "Sos List",
      description: "List all active machines.",
      params: [],
    },
    {
      name: "sos-route",
      label: "Sos Route",
      description: "Route machine to location (Layer 13: λ Location).",
      params: [],
    },
    {
      name: "sos-schedule",
      label: "Sos Schedule",
      description: "Schedule a delayed transition (Layer 12: ν Frequency).",
      params: [],
    },
    {
      name: "sos-state",
      label: "Sos State",
      description: "Get current state and available transitions.",
      params: [],
    },
    {
      name: "sos-transition",
      label: "Sos Transition",
      description: "Execute a transition by event name.",
      params: [],
    },
    {
      name: "sos-validate",
      label: "Sos Validate",
      description: "Validate a machine specification without creating it.",
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
