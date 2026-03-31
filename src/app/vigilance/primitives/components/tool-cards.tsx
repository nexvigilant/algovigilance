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
      name: "analyze-nothing",
      label: "Analyze Nothing",
      description: "Analyze a concept through the Nothing (void) primitive. Detects absence, gaps, missing elements, and void states. Nothin",
      params: ["concept"],
    },
    {
      name: "analyze-state",
      label: "Analyze State",
      description: "Analyze a concept through the State primitive. Identifies observable states, transitions, and distinguishability. State ",
      params: ["system"],
    },
    {
      name: "analyze-boundary",
      label: "Analyze Boundary",
      description: "Analyze a concept through the Boundary primitive. Identifies where things begin and end — the function that creates iden",
      params: ["entity"],
    },
    {
      name: "analyze-existence",
      label: "Analyze Existence",
      description: "Analyze a concept through the Existence primitive. Tests the conservation law: existence = boundary applied to the produ",
      params: ["subject"],
    },
    {
      name: "analyze-causality",
      label: "Analyze Causality",
      description: "Analyze a concept through the Causality primitive. Maps cause-effect chains, temporal ordering, and derivation strength.",
      params: ["cause", "effect"],
    },
    {
      name: "analyze-comparison",
      label: "Analyze Comparison",
      description: "Analyze two concepts through the Comparison primitive. Computes symmetric difference — what is shared, what is unique to",
      params: ["a", "b"],
    },
    {
      name: "analyze-quantity",
      label: "Analyze Quantity",
      description: "Analyze a concept through the Quantity primitive. Identifies what is countable, measurable, and quantifiable. Built on t",
      params: ["concept"],
    },
    {
      name: "analyze-sequence",
      label: "Analyze Sequence",
      description: "Analyze a concept through the Sequence primitive. Identifies ordering, dependencies, and iteration patterns. What must c",
      params: ["items"],
    },
    {
      name: "analyze-mapping",
      label: "Analyze Mapping",
      description: "Analyze a concept through the Mapping primitive. Identifies transformations between domains — what maps to what, what is",
      params: ["source", "target"],
    },
    {
      name: "analyze-recursion",
      label: "Analyze Recursion",
      description: "Analyze a concept through the Recursion primitive. Detects self-reference, fixed points, and containment depth. Does the",
      params: ["structure"],
    },
    {
      name: "analyze-frequency",
      label: "Analyze Frequency",
      description: "Analyze a concept through the Frequency primitive. Identifies rate, rhythm, repetition, and periodicity patterns. How of",
      params: ["signal"],
    },
    {
      name: "analyze-persistence",
      label: "Analyze Persistence",
      description: "Analyze a concept through the Persistence primitive. Identifies what endures, what mechanism preserves it, and its lifet",
      params: ["entity"],
    },
    {
      name: "analyze-location",
      label: "Analyze Location",
      description: "Analyze a concept through the Location primitive. Identifies address, reference, path, and reachability. Where is it in ",
      params: ["reference"],
    },
    {
      name: "analyze-irreversibility",
      label: "Analyze Irreversibility",
      description: "Analyze a concept through the Irreversibility primitive. Identifies entropy direction, reversibility, and consequence pe",
      params: ["action"],
    },
    {
      name: "analyze-sum",
      label: "Analyze Sum",
      description: "Analyze a concept through the Sum (disjoint union) primitive. Identifies variants, exhaustiveness, and selection. Which ",
      params: ["variants"],
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
