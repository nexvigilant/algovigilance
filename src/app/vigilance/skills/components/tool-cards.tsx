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
      name: "skill-categories-compute-intensive",
      label: "Skill Categories Compute Intensive",
      description: "Skill Categories Compute Intensive",
      params: [],
    },
    {
      name: "skill-chain-lookup",
      label: "Skill Chain Lookup",
      description: "Look up skill chains by name or trigger phrase",
      params: [],
    },
    {
      name: "skill-compile",
      label: "Skill Compile",
      description: "Compile knowledge from sources into a pack.",
      params: [],
    },
    {
      name: "skill-compile-check",
      label: "Skill Compile Check",
      description: "Check compatibility of skills for compilation (dry run).",
      params: [],
    },
    {
      name: "skill-dependency-graph",
      label: "Skill Dependency Graph",
      description: "Traverse skill dependency graph (upstream/downstream/see_also)",
      params: [],
    },
    {
      name: "skill-ecosystem-score",
      label: "Skill Ecosystem Score",
      description: "Compute ecosystem-level score with taxonomy and distribution analysis",
      params: [],
    },
    {
      name: "skill-evolution-track",
      label: "Skill Evolution Track",
      description: "Track skill evolution over time using filesystem timestamps and build history",
      params: [],
    },
    {
      name: "skill-execute",
      label: "Skill Execute",
      description: "Tauri app is running, these actions would proxy to the live backend.",
      params: [],
    },
    {
      name: "skill-gap-analysis",
      label: "Skill Gap Analysis",
      description: "Identify skill gaps against a target compliance level",
      params: [],
    },
    {
      name: "skill-get",
      label: "Skill Get",
      description: "Skill Get",
      params: [],
    },
    {
      name: "skill-ksb-verify",
      label: "Skill Ksb Verify",
      description: "Verify KSB (Knowledge, Skills, Behaviours) compliance",
      params: [],
    },
    {
      name: "skill-list",
      label: "Skill List",
      description: "Skill List",
      params: [],
    },
    {
      name: "skill-list-nested",
      label: "Skill List Nested",
      description: "Skill List Nested",
      params: [],
    },
    {
      name: "skill-maturity",
      label: "Skill Maturity",
      description: "Compute skill maturity from Practice, Consistency, and Transfer primitives",
      params: [],
    },
    {
      name: "skill-orchestration-analyze",
      label: "Skill Orchestration Analyze",
      description: "Analyze skills matching a path or glob pattern",
      params: [],
    },
    {
      name: "skill-quality-index",
      label: "Skill Quality Index",
      description: "Compute Skill Quality Index with extended per-dimension analysis",
      params: [],
    },
    {
      name: "skill-route",
      label: "Skill Route",
      description: "Skill Route",
      params: [],
    },
    {
      name: "skill-scan",
      label: "Skill Scan",
      description: "Skill Scan",
      params: [],
    },
    {
      name: "skill-schema",
      label: "Skill Schema",
      description: "Get skill input/output schema and execution methods",
      params: [],
    },
    {
      name: "skill-search-by-tag",
      label: "Skill Search By Tag",
      description: "Skill Search By Tag",
      params: [],
    },
    {
      name: "skill-taxonomy-list",
      label: "Skill Taxonomy List",
      description: "List taxonomy entries",
      params: [],
    },
    {
      name: "skill-taxonomy-query",
      label: "Skill Taxonomy Query",
      description: "Query taxonomy",
      params: [],
    },
    {
      name: "skill-token-analyze",
      label: "Skill Token Analyze",
      description: "Analyze a prompt through the ADME model.",
      params: [],
    },
    {
      name: "skill-validate",
      label: "Skill Validate",
      description: "Validate a pipeline definition.",
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
