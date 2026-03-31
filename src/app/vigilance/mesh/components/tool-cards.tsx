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
      name: "mesh-consistency",
      label: "Mesh Consistency",
      description: "Check consistency of terms across multiple corpora",
      params: [],
    },
    {
      name: "mesh-crossref",
      label: "Mesh Crossref",
      description: "Cross-reference a term across MESH, MedDRA, SNOMED, ICH",
      params: [],
    },
    {
      name: "mesh-enrich-pubmed",
      label: "Mesh Enrich Pubmed",
      description: "Enrich a PubMed article with MESH descriptors",
      params: [],
    },
    {
      name: "mesh-lookup",
      label: "Mesh Lookup",
      description: "Lookup a MESH descriptor by UI or name",
      params: [],
    },
    {
      name: "mesh-network-grounding",
      label: "Mesh Network Grounding",
      description: "Mesh Network Grounding",
      params: [],
    },
    {
      name: "mesh-network-node-info",
      label: "Mesh Network Node Info",
      description: "Tier: T2-C (Cross-domain composite tool)",
      params: [],
    },
    {
      name: "mesh-network-route-quality",
      label: "Mesh Network Route Quality",
      description: "Tier: T2-C (Cross-domain composite tool)",
      params: [],
    },
    {
      name: "mesh-network-simulate",
      label: "Mesh Network Simulate",
      description: "Tier: T3 (Domain-specific MCP tool)",
      params: [],
    },
    {
      name: "mesh-search",
      label: "Mesh Search",
      description: "Search documents by query string",
      params: [],
    },
    {
      name: "mesh-tree",
      label: "Mesh Tree",
      description: "Navigate MESH tree hierarchy",
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
