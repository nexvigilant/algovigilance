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
      name: "engram-by-source",
      label: "Engram By Source",
      description: "List engrams filtered by source layer.",
      params: [],
    },
    {
      name: "engram-decay-score",
      label: "Engram Decay Score",
      description: "Compute temporal decay score for an engram (pure computation, no store needed).",
      params: [],
    },
    {
      name: "engram-find-duplicates",
      label: "Engram Find Duplicates",
      description: "Find near-duplicate engrams by content similarity.",
      params: [],
    },
    {
      name: "engram-ingest",
      label: "Engram Ingest",
      description: "Ingest knowledge from a source file/directory into the store.",
      params: [],
    },
    {
      name: "engram-peek",
      label: "Engram Peek",
      description: "Get a specific engram by ID (read-only, no access tracking).",
      params: [],
    },
    {
      name: "engram-search",
      label: "Engram Search",
      description: "Search the engram store using TF-IDF ranking.",
      params: [],
    },
    {
      name: "engram-search-decay",
      label: "Engram Search Decay",
      description: "Search with temporal decay — recent knowledge ranks higher.",
      params: [],
    },
    {
      name: "engram-stats",
      label: "Engram Stats",
      description: "Get store statistics (total, active, stale counts by layer).",
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
