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
      name: "session-list",
      label: "Session List",
      description: "List recent brain sessions with metadata.",
      params: [],
    },
    {
      name: "session-load",
      label: "Session Load",
      description: "Load a specific session by ID.",
      params: ["session_id"],
    },
    {
      name: "artifact-get",
      label: "Artifact Get",
      description: "Retrieve an artifact by name from a session.",
      params: ["name"],
    },
    {
      name: "artifact-diff",
      label: "Artifact Diff",
      description: "Diff two versions of an artifact.",
      params: ["name"],
    },
    {
      name: "implicit-get",
      label: "Implicit Get",
      description: "Query implicit knowledge store (patterns, corrections, beliefs, trust).",
      params: ["store"],
    },
    {
      name: "implicit-stats",
      label: "Implicit Stats",
      description: "Get statistics across all implicit knowledge stores.",
      params: [],
    },
    {
      name: "patterns-by-relevance",
      label: "Patterns By Relevance",
      description: "Get learned patterns ranked by relevance score.",
      params: [],
    },
    {
      name: "find-corrections",
      label: "Find Corrections",
      description: "Find active corrections (learned mistakes to avoid).",
      params: [],
    },
    {
      name: "belief-list",
      label: "Belief List",
      description: "List all beliefs with confidence scores.",
      params: [],
    },
    {
      name: "belief-get",
      label: "Belief Get",
      description: "Get a specific belief by key.",
      params: ["key"],
    },
    {
      name: "trust-global",
      label: "Trust Global",
      description: "Get global trust scores across all domains.",
      params: [],
    },
    {
      name: "health",
      label: "Health",
      description: "Brain health check — DB connectivity, store integrity, artifact counts.",
      params: [],
    },
    {
      name: "summary",
      label: "Summary",
      description: "Brain database summary — sessions, artifacts, decisions, tools used.",
      params: [],
    },
    {
      name: "growth-rate",
      label: "Growth Rate",
      description: "Brain growth rate — artifact/session accumulation trends.",
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
