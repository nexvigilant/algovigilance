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
      name: "trial-adapt-decide",
      label: "Trial Adapt Decide",
      description: "Evaluate an adaptive modification against pre-specified protocol rules.",
      params: [],
    },
    {
      name: "trial-blind-verify",
      label: "Trial Blind Verify",
      description: "Verify blinding integrity of a randomization assignment list.",
      params: [],
    },
    {
      name: "trial-endpoint-evaluate",
      label: "Trial Endpoint Evaluate",
      description: "Evaluate a primary or secondary endpoint with statistical testing.",
      params: [],
    },
    {
      name: "trial-interim-analyze",
      label: "Trial Interim Analyze",
      description: "Run interim analysis using OBF or Pocock boundaries.",
      params: [],
    },
    {
      name: "trial-multiplicity-adjust",
      label: "Trial Multiplicity Adjust",
      description: "Apply multiplicity adjustment to a set of p-values.",
      params: [],
    },
    {
      name: "trial-power-analysis",
      label: "Trial Power Analysis",
      description: "Compute per-arm sample size for the specified test type.",
      params: [],
    },
    {
      name: "trial-protocol-register",
      label: "Trial Protocol Register",
      description: "Register a new trial protocol. Validates all fields and generates a UUID trial ID.",
      params: [],
    },
    {
      name: "trial-randomize",
      label: "Trial Randomize",
      description: "Randomize subjects to arms using simple, block, or stratified schemes.",
      params: [],
    },
    {
      name: "trial-report-generate",
      label: "Trial Report Generate",
      description: "Generate a CONSORT-style Markdown report for a completed trial.",
      params: [],
    },
    {
      name: "trial-safety-check",
      label: "Trial Safety Check",
      description: "Check an observed safety metric against its pre-specified threshold.",
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
