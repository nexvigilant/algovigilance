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
      name: "claude-fs-backup-now",
      label: "Claude Fs Backup Now",
      description: "Claude Fs Backup Now",
      params: [],
    },
    {
      name: "claude-fs-delete",
      label: "Claude Fs Delete",
      description: "Delete a file or directory under `.claude`.",
      params: [],
    },
    {
      name: "claude-fs-diff",
      label: "Claude Fs Diff",
      description: "Diff two files under `.claude` (simple line diff).",
      params: [],
    },
    {
      name: "claude-fs-list",
      label: "Claude Fs List",
      description: "List files under a `.claude` path (non-recursive).",
      params: [],
    },
    {
      name: "claude-fs-read",
      label: "Claude Fs Read",
      description: "Read a file under `.claude`.",
      params: [],
    },
    {
      name: "claude-fs-search",
      label: "Claude Fs Search",
      description: "Search for a substring in files under `.claude`.",
      params: [],
    },
    {
      name: "claude-fs-stat",
      label: "Claude Fs Stat",
      description: "Stat a file under `.claude`.",
      params: [],
    },
    {
      name: "claude-fs-tail",
      label: "Claude Fs Tail",
      description: "Tail last N lines of a file under `.claude`.",
      params: [],
    },
    {
      name: "claude-fs-write",
      label: "Claude Fs Write",
      description: "Write a file under `.claude`.",
      params: [],
    },
    {
      name: "claude-repl",
      label: "Claude Repl",
      description: "Bridge to Claude Code CLI.",
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
