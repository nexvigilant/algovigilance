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
      name: "chemotaxis-gradient",
      label: "Chemotaxis Gradient",
      description: "- λ (location): Spatial distribution of signal concentrations",
      params: [],
    },
    {
      name: "endocytosis-internalize",
      label: "Endocytosis Internalize",
      description: "- ρ (recursion): Internalized signal triggers recursive cascade processing",
      params: [],
    },
    {
      name: "nmd-adaptive-stats",
      label: "Nmd Adaptive Stats",
      description: "Get adaptive engine statistics.",
      params: [],
    },
    {
      name: "nmd-check",
      label: "Nmd Check",
      description: "the filtered verdict, actions, and learning events.",
      params: [],
    },
    {
      name: "nmd-smg-process",
      label: "Nmd Smg Process",
      description: "Process a verdict through the SMG degradation complex.",
      params: [],
    },
    {
      name: "nmd-status",
      label: "Nmd Status",
      description: "Nmd Status",
      params: [],
    },
    {
      name: "nmd-thymic-status",
      label: "Nmd Thymic Status",
      description: "Get thymic graduation status.",
      params: [],
    },
    {
      name: "nmd-upf-evaluate",
      label: "Nmd Upf Evaluate",
      description: "Raw UPF structural check only (no thymic/SMG/adaptive).",
      params: [],
    },
    {
      name: "ribosome-drift",
      label: "Ribosome Drift",
      description: "Batch drift detection across contracts.",
      params: [],
    },
    {
      name: "ribosome-generate",
      label: "Ribosome Generate",
      description: "Generate synthetic data from a stored contract's schema.",
      params: [],
    },
    {
      name: "ribosome-list",
      label: "Ribosome List",
      description: "Ribosome List",
      params: [],
    },
    {
      name: "ribosome-store",
      label: "Ribosome Store",
      description: "Store a baseline contract from JSON data.",
      params: [],
    },
    {
      name: "ribosome-validate",
      label: "Ribosome Validate",
      description: "Validate data against a stored contract (drift detection).",
      params: [],
    },
    {
      name: "synapse-get",
      label: "Synapse Get",
      description: "Get synapse information by ID",
      params: [],
    },
    {
      name: "synapse-get-or-create",
      label: "Synapse Get Or Create",
      description: "Create or get a synapse by ID",
      params: [],
    },
    {
      name: "synapse-list",
      label: "Synapse List",
      description: "List all synapses with optional filtering",
      params: [],
    },
    {
      name: "synapse-observe",
      label: "Synapse Observe",
      description: "Observe a learning signal on a synapse",
      params: [],
    },
    {
      name: "synapse-prune",
      label: "Synapse Prune",
      description: "Synapse Prune",
      params: [],
    },
    {
      name: "synapse-stats",
      label: "Synapse Stats",
      description: "Synapse Stats",
      params: [],
    },
    {
      name: "transcriptase-generate",
      label: "Transcriptase Generate",
      description: "Generate synthetic data from observed JSON.",
      params: [],
    },
    {
      name: "transcriptase-infer",
      label: "Transcriptase Infer",
      description: "Schema inference only — lightweight, no violations or fidelity.",
      params: [],
    },
    {
      name: "transcriptase-process",
      label: "Transcriptase Process",
      description: "Full pipeline: infer + merge + violations + fidelity.",
      params: [],
    },
    {
      name: "transcriptase-violations",
      label: "Transcriptase Violations",
      description: "Synthesize boundary violations from observed data.",
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
