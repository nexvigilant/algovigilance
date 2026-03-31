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
      name: "brand-decomposition-get",
      label: "Brand Decomposition Get",
      description: "Get a brand decomposition by name (currently only \"nexvigilant\" is pre-computed)",
      params: [],
    },
    {
      name: "brand-decomposition-nexvigilant",
      label: "Brand Decomposition Nexvigilant",
      description: "Brand Decomposition Nexvigilant",
      params: [],
    },
    {
      name: "brand-primitive-test",
      label: "Brand Primitive Test",
      description: "Run a primitive test on a term",
      params: [],
    },
    {
      name: "brand-semantic-tiers",
      label: "Brand Semantic Tiers",
      description: "Brand Semantic Tiers",
      params: [],
    },
    {
      name: "declension-agree",
      label: "Declension Agree",
      description: "/// Tier: T3 (nexcore-declension × MCP integration)",
      params: [],
    },
    {
      name: "declension-classify",
      label: "Declension Classify",
      description: "/// Tier: T3 (nexcore-declension × MCP integration)",
      params: [],
    },
    {
      name: "declension-inflect",
      label: "Declension Inflect",
      description: "/// Tier: T3 (nexcore-declension × MCP integration)",
      params: [],
    },
    {
      name: "declension-prodrop",
      label: "Declension Prodrop",
      description: "/// Tier: T3 (nexcore-declension × MCP integration)",
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
