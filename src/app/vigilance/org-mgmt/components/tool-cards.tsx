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
      name: "organize-analyze",
      label: "Organize Analyze",
      description: "Run the full ORGANIZE pipeline in analysis (dry-run) mode.",
      params: [],
    },
    {
      name: "organize-config-default",
      label: "Organize Config Default",
      description: "Return default ORGANIZE configuration for a directory.",
      params: [],
    },
    {
      name: "organize-observe",
      label: "Organize Observe",
      description: "Run the observe step only — inventory filesystem entries with metadata.",
      params: [],
    },
    {
      name: "organize-rank",
      label: "Organize Rank",
      description: "Run observe + rank steps — inventory and score entries by recency/size/relevance.",
      params: [],
    },
    {
      name: "organize-report-json",
      label: "Organize Report Json",
      description: "Run ORGANIZE pipeline and return a JSON report.",
      params: [],
    },
    {
      name: "organize-report-markdown",
      label: "Organize Report Markdown",
      description: "Run ORGANIZE pipeline and return a markdown report.",
      params: [],
    },
    {
      name: "pom-chromatograph",
      label: "Pom Chromatograph",
      description: "Classify atoms into hierarchy positions via chromatographic separation.",
      params: [],
    },
    {
      name: "pom-distill",
      label: "Pom Distill",
      description: "Distill a regulatory expression into atoms ordered by volatility.",
      params: [],
    },
    {
      name: "pom-prove-equivalence",
      label: "Pom Prove Equivalence",
      description: "Prove semantic equivalence between two regulatory expressions.",
      params: [],
    },
    {
      name: "pom-registry-stats",
      label: "Pom Registry Stats",
      description: "Get registry statistics — atom count by class and total.",
      params: [],
    },
    {
      name: "pom-titrate",
      label: "Pom Titrate",
      description: "Titrate an expression against canonical standards to measure meaning coverage.",
      params: [],
    },
    {
      name: "prima-codegen",
      label: "Prima Codegen",
      description: "Generate code from Prima source for a target language.",
      params: [],
    },
    {
      name: "prima-eval",
      label: "Prima Eval",
      description: "Evaluate a Prima expression and return the result.",
      params: [],
    },
    {
      name: "prima-parse",
      label: "Prima Parse",
      description: "Parse Prima source code and return AST as JSON.",
      params: [],
    },
    {
      name: "prima-primitives",
      label: "Prima Primitives",
      description: "Analyze Prima source and list the T1 primitives used.",
      params: [],
    },
    {
      name: "prima-targets",
      label: "Prima Targets",
      description: "Prima Targets",
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
