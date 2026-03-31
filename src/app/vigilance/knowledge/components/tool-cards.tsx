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
      name: "knowledge-engine-compile",
      label: "Knowledge Engine Compile",
      description: "Compile knowledge from sources into a pack.",
      params: [],
    },
    {
      name: "knowledge-engine-compress",
      label: "Knowledge Engine Compress",
      description: "Compress text and return before/after scores.",
      params: [],
    },
    {
      name: "knowledge-engine-delete",
      label: "Knowledge Engine Delete",
      description: "Remove a knowledge pack (all versions or a specific version).",
      params: [],
    },
    {
      name: "knowledge-engine-extract-concepts",
      label: "Knowledge Engine Extract Concepts",
      description: "Knowledge Engine Extract Concepts",
      params: [],
    },
    {
      name: "knowledge-engine-extract-primitives",
      label: "Knowledge Engine Extract Primitives",
      description: "Knowledge Engine Extract Primitives",
      params: [],
    },
    {
      name: "knowledge-engine-ingest",
      label: "Knowledge Engine Ingest",
      description: "and are automatically included in the next `knowledge_compile` invocation.",
      params: [],
    },
    {
      name: "knowledge-engine-prune",
      label: "Knowledge Engine Prune",
      description: "Prune old versions of a knowledge pack, keeping only the N most recent.",
      params: [],
    },
    {
      name: "knowledge-engine-query",
      label: "Knowledge Engine Query",
      description: "Raw SQL query (read-only, max 100 rows).",
      params: [],
    },
    {
      name: "knowledge-engine-score",
      label: "Knowledge Engine Score",
      description: "and the limiting factor dragging the score down.",
      params: [],
    },
    {
      name: "knowledge-engine-stats",
      label: "Knowledge Engine Stats",
      description: "Get knowledge engine statistics.",
      params: [],
    },
    {
      name: "knowledge-vault-list",
      label: "Knowledge Vault List",
      description: "List files and directories in the knowledge vault.",
      params: [],
    },
    {
      name: "knowledge-vault-move",
      label: "Knowledge Vault Move",
      description: "Move or rename a note in the knowledge vault.",
      params: [],
    },
    {
      name: "knowledge-vault-read",
      label: "Knowledge Vault Read",
      description: "Read a note from the knowledge vault by relative path.",
      params: [],
    },
    {
      name: "knowledge-vault-search",
      label: "Knowledge Vault Search",
      description: "Search knowledge vault content and filenames by query string.",
      params: [],
    },
    {
      name: "knowledge-vault-tags",
      label: "Knowledge Vault Tags",
      description: "List all #tags used across the knowledge vault with counts.",
      params: [],
    },
    {
      name: "knowledge-vault-write",
      label: "Knowledge Vault Write",
      description: "Write or create a note in the knowledge vault.",
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
