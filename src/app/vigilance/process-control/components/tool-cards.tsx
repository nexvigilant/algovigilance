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
      name: "ccp-dose-compute",
      label: "Ccp Dose Compute",
      description: "Compute recommended dose given strategy and target.",
      params: [],
    },
    {
      name: "ccp-episode-advance",
      label: "Ccp Episode Advance",
      description: "Administer dose, apply decay, and optionally transition phase.",
      params: [],
    },
    {
      name: "ccp-episode-start",
      label: "Ccp Episode Start",
      description: "Start a new care episode at the Collect phase.",
      params: [],
    },
    {
      name: "ccp-interaction-check",
      label: "Ccp Interaction Check",
      description: "Check interaction effects between two plasma levels.",
      params: [],
    },
    {
      name: "ccp-phase-transition",
      label: "Ccp Phase Transition",
      description: "Validate and execute a phase transition.",
      params: [],
    },
    {
      name: "ccp-quality-score",
      label: "Ccp Quality Score",
      description: "Score episode quality on [0, 10] scale.",
      params: [],
    },
    {
      name: "retro-cluster-signals",
      label: "Retro Cluster Signals",
      description: "Cluster structured signals by structural similarity.",
      params: [],
    },
    {
      name: "retro-correlate-alerts",
      label: "Retro Correlate Alerts",
      description: "Correlate structural clusters with adverse event patterns to find alert candidates.",
      params: [],
    },
    {
      name: "retro-dataset-stats",
      label: "Retro Dataset Stats",
      description: "Compute summary statistics for a retrocasting training dataset.",
      params: [],
    },
    {
      name: "retro-extract-features",
      label: "Retro Extract Features",
      description: "Extract a 160-dimensional ML feature vector from a SMILES string.",
      params: [],
    },
    {
      name: "retro-signal-significance",
      label: "Retro Signal Significance",
      description: "Retro Signal Significance",
      params: [],
    },
    {
      name: "retro-structural-similarity",
      label: "Retro Structural Similarity",
      description: "Retro Structural Similarity",
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
