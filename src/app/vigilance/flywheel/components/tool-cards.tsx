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
      name: "flywheel-cascade",
      label: "Flywheel Cascade",
      description: "Momentum L is automatically fed into gyroscopic input.",
      params: [],
    },
    {
      name: "flywheel-evaluate-extended",
      label: "Flywheel Evaluate Extended",
      description: "don't overwhelm core evidence.",
      params: [],
    },
    {
      name: "flywheel-evaluate-live",
      label: "Flywheel Evaluate Live",
      description: "with VDAG Reality Gradient. All fields optional — omit to use defaults (0).",
      params: [],
    },
    {
      name: "flywheel-learn",
      label: "Flywheel Learn",
      description: "- Triple loop: question the model itself (every 5th analysis).",
      params: [],
    },
    {
      name: "flywheel-reality",
      label: "Flywheel Reality",
      description: "Reality < 0.20 = testing theater (not executable).",
      params: [],
    },
    {
      name: "flywheel-vitals",
      label: "Flywheel Vitals",
      description: "Useful for establishing a baseline or inspecting the default configuration.",
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
