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
      name: "registry-assess-all",
      label: "Registry Assess All",
      description: "Assess all skills in the registry.",
      params: [],
    },
    {
      name: "registry-assess-skill",
      label: "Registry Assess Skill",
      description: "Assess a single skill's compliance tier and SMST v2 score.",
      params: [],
    },
    {
      name: "registry-gap-report",
      label: "Registry Gap Report",
      description: "Generate a gap report for the entire skill ecosystem.",
      params: [],
    },
    {
      name: "registry-promotable",
      label: "Registry Promotable",
      description: "Get skills eligible for promotion to a target tier.",
      params: [],
    },
    {
      name: "registry-promotion-plan",
      label: "Registry Promotion Plan",
      description: "Generate a promotion plan for a skill to reach a target tier.",
      params: [],
    },
    {
      name: "registry-tov-harm",
      label: "Registry Tov Harm",
      description: "Compute all 8 harm type indicators (A-H).",
      params: [],
    },
    {
      name: "registry-tov-is-safe",
      label: "Registry Tov Is Safe",
      description: "Check if the ecosystem is in the safe manifold.",
      params: [],
    },
    {
      name: "registry-tov-safety",
      label: "Registry Tov Safety",
      description: "Compute the ToV safety distance d(s) for the ecosystem.",
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
