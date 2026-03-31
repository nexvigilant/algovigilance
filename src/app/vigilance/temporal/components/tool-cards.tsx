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
      name: "chrono-duration",
      label: "Chrono Duration",
      description: "Negative values produce negative durations.",
      params: [],
    },
    {
      name: "chrono-format",
      label: "Chrono Format",
      description: "Supported specifiers: `%Y`, `%m`, `%d`, `%H`, `%M`, `%S`, `%F`, `%T`, `%%`.",
      params: [],
    },
    {
      name: "chrono-now",
      label: "Chrono Now",
      description: "Chrono Now",
      params: [],
    },
    {
      name: "chrono-parse",
      label: "Chrono Parse",
      description: "supplied strftime pattern (e.g. \"%Y-%m-%d %H:%M:%S\").",
      params: [],
    },
    {
      name: "temporal-challenge",
      label: "Temporal Challenge",
      description: "Faster resolution (<7d dechallenge, <3d rechallenge) adds confidence bonus.",
      params: [],
    },
    {
      name: "temporal-plausibility",
      label: "Temporal Plausibility",
      description: "whether TTO falls within an expected mechanism-based onset range.",
      params: [],
    },
    {
      name: "temporal-tto",
      label: "Temporal Tto",
      description: "Latent (1-12mo), or Chronic (>12mo), and returns plausibility score.",
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
