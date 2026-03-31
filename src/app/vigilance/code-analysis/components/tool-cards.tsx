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
      name: "ast-query-file",
      label: "Ast Query File",
      description: "Parse a single Rust source file and return all extracted items.",
      params: [],
    },
    {
      name: "ast-query-implementors",
      label: "Ast Query Implementors",
      description: "Find all implementors of a trait within a crate.",
      params: [],
    },
    {
      name: "ast-query-search",
      label: "Ast Query Search",
      description: "Search a crate's source files for items matching a name pattern.",
      params: [],
    },
    {
      name: "code-inspect-audit",
      label: "Code Inspect Audit",
      description: "Run a full code inspection audit on a file or directory.",
      params: [],
    },
    {
      name: "code-inspect-criteria",
      label: "Code Inspect Criteria",
      description: "Get inspection criteria definitions.",
      params: [],
    },
    {
      name: "code-inspect-score",
      label: "Code Inspect Score",
      description: "Score source code against all three dimensions.",
      params: [],
    },
    {
      name: "code-tracker-changed",
      label: "Code Tracker Changed",
      description: "Check if a tracked file has changed",
      params: [],
    },
    {
      name: "code-tracker-original",
      label: "Code Tracker Original",
      description: "Get the original content of a tracked file when it was first tracked.",
      params: [],
    },
    {
      name: "code-tracker-track",
      label: "Code Tracker Track",
      description: "Track a file for change detection",
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
