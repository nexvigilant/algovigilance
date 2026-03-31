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
      name: "pharma-boxed-warnings",
      label: "Pharma Boxed Warnings",
      description: "/// Useful for safety surveillance and competitive black-box analysis.",
      params: [],
    },
    {
      name: "pharma-classify-generators",
      label: "Pharma Classify Generators",
      description: "Classify a set of generators into a Chomsky hierarchy level.",
      params: [],
    },
    {
      name: "pharma-company-profile",
      label: "Pharma Company Profile",
      description: "communications.",
      params: [],
    },
    {
      name: "pharma-lookup-transfer",
      label: "Pharma Lookup Transfer",
      description: "Look up transfer confidence for a pharma primitive to a target domain.",
      params: [],
    },
    {
      name: "pharma-pipeline",
      label: "Pharma Pipeline",
      description: "Omitting `phase` returns all candidates.",
      params: [],
    },
    {
      name: "pharma-pipeline-stage",
      label: "Pharma Pipeline Stage",
      description: "Get info about a specific R&D pipeline stage.",
      params: [],
    },
    {
      name: "pharma-signal-portfolio",
      label: "Pharma Signal Portfolio",
      description: "accumulated across its entire portfolio?\"",
      params: [],
    },
    {
      name: "pharma-strongest-transfers",
      label: "Pharma Strongest Transfers",
      description: "Get the top N strongest cross-domain transfer corridors.",
      params: [],
    },
    {
      name: "pharma-symbol-coverage",
      label: "Pharma Symbol Coverage",
      description: "Get Lex Primitiva symbol coverage across the R&D pipeline.",
      params: [],
    },
    {
      name: "pharma-taxonomy-summary",
      label: "Pharma Taxonomy Summary",
      description: "Get the full pharma R&D taxonomy summary (concept counts by tier).",
      params: [],
    },
    {
      name: "pharma-transfer-matrix",
      label: "Pharma Transfer Matrix",
      description: "Get the full transfer confidence matrix (all primitives x all domains).",
      params: [],
    },
    {
      name: "pharma-weakest-transfers",
      label: "Pharma Weakest Transfers",
      description: "Get the bottom N weakest cross-domain transfer corridors.",
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
