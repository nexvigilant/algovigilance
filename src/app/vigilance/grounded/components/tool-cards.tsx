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
      name: "grounded-compose",
      label: "Grounded Compose",
      description: "Compose two confidence values multiplicatively (P(A∧B) = P(A) × P(B)).",
      params: [],
    },
    {
      name: "grounded-evidence-get",
      label: "Grounded Evidence Get",
      description: "Get the full evidence chain with all steps and current confidence.",
      params: [],
    },
    {
      name: "grounded-evidence-new",
      label: "Grounded Evidence New",
      description: "Start a new evidence chain for a claim.",
      params: [],
    },
    {
      name: "grounded-evidence-step",
      label: "Grounded Evidence Step",
      description: "Add a step to an existing evidence chain (strengthen or weaken).",
      params: [],
    },
    {
      name: "grounded-require",
      label: "Grounded Require",
      description: "Gate a value on minimum confidence — returns Ok or rejects with explanation.",
      params: [],
    },
    {
      name: "grounded-skill-assess",
      label: "Grounded Skill Assess",
      description: "Run a grounded skill assessment (Bronze→Diamond compliance).",
      params: [],
    },
    {
      name: "grounded-uncertain",
      label: "Grounded Uncertain",
      description: "Wrap a value with confidence and get its band classification.",
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
