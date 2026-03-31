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
      name: "foundry-cascade-validate",
      label: "Foundry Cascade Validate",
      description: "aligned (all operational goals trace to strategic level).",
      params: [],
    },
    {
      name: "foundry-infer",
      label: "Foundry Infer",
      description: "[`InferenceEngine`], and returns the resulting intelligence report.",
      params: [],
    },
    {
      name: "foundry-render-intelligence",
      label: "Foundry Render Intelligence",
      description: "Render an A3 intelligence report as markdown.",
      params: [],
    },
    {
      name: "foundry-validate-artifact",
      label: "Foundry Validate Artifact",
      description: "a shippable-artifact readiness flag.",
      params: [],
    },
    {
      name: "foundry-vdag-order",
      label: "Foundry Vdag Order",
      description: "Return the VDAG pipeline ordering for a given variant.",
      params: [],
    },
    {
      name: "ghost-boundary-check",
      label: "Ghost Boundary Check",
      description: "Check anonymization boundary violations for given metrics.",
      params: [],
    },
    {
      name: "ghost-category-policy",
      label: "Ghost Category Policy",
      description: "Get the effective policy for a data category under a given mode.",
      params: [],
    },
    {
      name: "ghost-mode-info",
      label: "Ghost Mode Info",
      description: "Get properties for a ghost mode.",
      params: [],
    },
    {
      name: "ghost-scan-pii",
      label: "Ghost Scan Pii",
      description: "Scan fields for PII leak patterns.",
      params: [],
    },
    {
      name: "ghost-scrub-fields",
      label: "Ghost Scrub Fields",
      description: "Scrub PII from a set of fields according to ghost mode policy.",
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
