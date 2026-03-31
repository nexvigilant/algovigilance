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
      name: "highway-classify",
      label: "Highway Classify",
      description: "Classify a tool into Digital Highway tiers I-IV.",
      params: [],
    },
    {
      name: "highway-destructive",
      label: "Highway Destructive",
      description: "Compute destructive factor score for infrastructure stress.",
      params: [],
    },
    {
      name: "highway-grade-separate",
      label: "Highway Grade Separate",
      description: "Sort tools into grade-separated batches by highway class.",
      params: [],
    },
    {
      name: "highway-interchange",
      label: "Highway Interchange",
      description: "Merge N parallel tool results through grounded confidence composition.",
      params: [],
    },
    {
      name: "highway-legitimate-field",
      label: "Highway Legitimate Field",
      description: "Check if a tool is being used in its legitimate transportation field.",
      params: [],
    },
    {
      name: "highway-parallel-plan",
      label: "Highway Parallel Plan",
      description: "Plan parallel lanes for a batch of tool calls with grade separation.",
      params: [],
    },
    {
      name: "highway-quality",
      label: "Highway Quality",
      description: "Score a tool against the 7 Ideal Tool Qualities.",
      params: [],
    },
    {
      name: "highway-traffic-census",
      label: "Highway Traffic Census",
      description: "Run a traffic census on tool usage — reads brain.db telemetry.",
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
