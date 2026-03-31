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
      name: "anatomy-blast-radius",
      label: "Anatomy Blast Radius",
      description: "/// Tier: T3 (nexcore-anatomy × MCP integration)",
      params: [],
    },
    {
      name: "anatomy-chomsky",
      label: "Anatomy Chomsky",
      description: "/// Tier: T3 (nexcore-anatomy × MCP integration)",
      params: [],
    },
    {
      name: "anatomy-health",
      label: "Anatomy Health",
      description: "Anatomy Health",
      params: [],
    },
    {
      name: "anatomy-query",
      label: "Anatomy Query",
      description: "Anatomy Query",
      params: [],
    },
    {
      name: "anatomy-record-cytokine",
      label: "Anatomy Record Cytokine",
      description: "Anatomy Record Cytokine",
      params: [],
    },
    {
      name: "anatomy-record-energy",
      label: "Anatomy Record Energy",
      description: "Anatomy Record Energy",
      params: [],
    },
    {
      name: "anatomy-record-guardian-tick",
      label: "Anatomy Record Guardian Tick",
      description: "Anatomy Record Guardian Tick",
      params: [],
    },
    {
      name: "anatomy-record-hormones",
      label: "Anatomy Record Hormones",
      description: "Anatomy Record Hormones",
      params: [],
    },
    {
      name: "anatomy-record-immunity-event",
      label: "Anatomy Record Immunity Event",
      description: "Anatomy Record Immunity Event",
      params: [],
    },
    {
      name: "anatomy-record-organ-signal",
      label: "Anatomy Record Organ Signal",
      description: "Anatomy Record Organ Signal",
      params: [],
    },
    {
      name: "anatomy-record-phenotype",
      label: "Anatomy Record Phenotype",
      description: "Anatomy Record Phenotype",
      params: [],
    },
    {
      name: "anatomy-record-ribosome",
      label: "Anatomy Record Ribosome",
      description: "Anatomy Record Ribosome",
      params: [],
    },
    {
      name: "anatomy-record-synapse",
      label: "Anatomy Record Synapse",
      description: "Anatomy Record Synapse",
      params: [],
    },
    {
      name: "anatomy-record-transcriptase",
      label: "Anatomy Record Transcriptase",
      description: "Anatomy Record Transcriptase",
      params: [],
    },
    {
      name: "anatomy-status",
      label: "Anatomy Status",
      description: "Anatomy Status",
      params: [],
    },
    {
      name: "anatomy-violations",
      label: "Anatomy Violations",
      description: "Anatomy Violations",
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
