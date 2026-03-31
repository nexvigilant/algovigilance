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
      name: "get-axioms",
      label: "Get Axioms",
      description: "List all 6 axioms of signal theory with their primitive mappings. A1 Data Generation (ν), A2 Noise Dominance (∅), A3 Sig",
      params: [],
    },
    {
      name: "get-theorems",
      label: "Get Theorems",
      description: "List all 5 theorems of signal theory with their prerequisites and formal statements.",
      params: [],
    },
    {
      name: "detect",
      label: "Detect",
      description: "Run signal detection: compare observed count vs expected count against a threshold. Returns ratio, difference, detection",
      params: ["observed", "expected"],
    },
    {
      name: "decision-matrix",
      label: "Decision Matrix",
      description: "Compute SDT decision matrix metrics from a 2×2 classification table (hits, misses, false alarms, correct rejections). Re",
      params: ["hits", "misses", "false_alarms", "correct_rejections"],
    },
    {
      name: "conservation-check",
      label: "Conservation Check",
      description: "Verify conservation laws (L1-L4) on a decision matrix. Checks total count conservation and information conservation (d-p",
      params: ["hits", "misses", "false_alarms", "correct_rejections"],
    },
    {
      name: "pipeline",
      label: "Pipeline",
      description: "Run a multi-stage signal detection pipeline. A value passes through sequential stages, each with its own threshold. Repo",
      params: ["value", "stages"],
    },
    {
      name: "cascade",
      label: "Cascade",
      description: "Cascading threshold evaluation — find the highest severity level exceeded. Thresholds in ascending order with labels. Re",
      params: ["value", "thresholds", "labels"],
    },
    {
      name: "parallel",
      label: "Parallel",
      description: "Parallel signal detection across two independent detectors. Mode 'both' (AND) requires both to fire. Mode 'either' (OR) ",
      params: ["value", "threshold_1", "threshold_2"],
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
