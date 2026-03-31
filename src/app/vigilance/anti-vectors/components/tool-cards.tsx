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
  class: "mechanistic" | "epistemic" | "architectural" | "all"
}

const TOOLS: ToolDef[] = [
  {
    name: "classify",
    label: "Classify Anti-Vector",
    description: "Given a harm type (A-H), returns the recommended anti-vector strategy: which class to prioritize, what risk minimization measures to consider, and which biases commonly generate false signals for this harm type.",
    params: ["harm_type"],
    class: "all",
  },
  {
    name: "compute",
    label: "Compute Anti-Vector",
    description: "Given a drug-event pair with signal magnitude, computes the complete anti-vector with all three components. Includes epistemic bias assessment, architectural proportionality scoring, and annihilation result.",
    params: ["drug", "event", "harm_type", "magnitude", "confidence", "bias_type", "bias_magnitude"],
    class: "all",
  },
  {
    name: "report",
    label: "Annihilation Report",
    description: "Generates a human-readable report showing what happens when the anti-vector meets the harm vector. Includes mechanistic pathway analysis, epistemic verdict, architectural measure selection, and final outcome.",
    params: ["drug", "event", "harm_type", "magnitude", "confidence", "intervention", "expected_attenuation"],
    class: "all",
  },
]

const CLASS_COLORS: Record<string, string> = {
  mechanistic: "bg-blue-500/10 text-blue-400",
  epistemic: "bg-amber-500/10 text-amber-400",
  architectural: "bg-emerald-500/10 text-emerald-400",
  all: "bg-primary/10 text-primary",
}

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
            onClick={() => setSelectedTool(selectedTool === tool.name ? null : tool.name)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tool.label}</CardTitle>
                <Badge variant="outline" className={CLASS_COLORS[tool.class]}>
                  {tool.class}
                </Badge>
              </div>
              <CardDescription className="text-xs line-clamp-2">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {tool.params.map((param) => (
                  <Badge key={param} variant="secondary" className="text-xs">
                    {param}
                  </Badge>
                ))}
              </div>
              {selectedTool === tool.name && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">
                    {tool.description}
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/vigilance/anti-vectors/${tool.name}`}>
                      Try it
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">The Anti-Vector Pipeline</p>
        <p>
          Signal Detection → Harm Classification → Anti-Vector Computation → Annihilation Report
        </p>
        <p className="mt-1 text-xs">
          Start with <code className="text-primary">/station-signal</code> to detect the signal,
          then use these tools to compute what to do about it.
        </p>
      </div>
    </div>
  )
}
