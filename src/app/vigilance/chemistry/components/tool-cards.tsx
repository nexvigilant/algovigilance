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
      name: "chemistry-buffer-capacity",
      label: "Chemistry Buffer Capacity",
      description: "Calculate buffer capacity. PV confidence: 0.78",
      params: [],
    },
    {
      name: "chemistry-decay-remaining",
      label: "Chemistry Decay Remaining",
      description: "Calculate remaining after decay (half-life kinetics). PV confidence: 0.90",
      params: [],
    },
    {
      name: "chemistry-dependency-rate",
      label: "Chemistry Dependency Rate",
      description: "Calculate rate law dependency. PV confidence: 0.82",
      params: [],
    },
    {
      name: "chemistry-equilibrium",
      label: "Chemistry Equilibrium",
      description: "Calculate equilibrium steady-state fractions. PV confidence: 0.72",
      params: [],
    },
    {
      name: "chemistry-eyring-rate",
      label: "Chemistry Eyring Rate",
      description: "Calculate Eyring rate (transition state theory). PV confidence: 0.82",
      params: [],
    },
    {
      name: "chemistry-feasibility",
      label: "Chemistry Feasibility",
      description: "Calculate Gibbs free energy feasibility. PV confidence: 0.85",
      params: [],
    },
    {
      name: "chemistry-first-law-closed",
      label: "Chemistry First Law Closed",
      description: "ΔU = Q - W (Conservation of Energy)",
      params: [],
    },
    {
      name: "chemistry-first-law-open",
      label: "Chemistry First Law Open",
      description: "dE/dt = Q̇ - Ẇ + Σṁh_in - Σṁh_out",
      params: [],
    },
    {
      name: "chemistry-gaussian-overlap",
      label: "Chemistry Gaussian Overlap",
      description: "/// PV confidence: 0.78 (wavefunction overlap → signal co-occurrence)",
      params: [],
    },
    {
      name: "chemistry-hill-response",
      label: "Chemistry Hill Response",
      description: "Calculate Hill equation response (cooperative binding). PV confidence: 0.85",
      params: [],
    },
    {
      name: "chemistry-inhibition-rate",
      label: "Chemistry Inhibition Rate",
      description: "Calculate competitive inhibition rate. PV confidence: 0.78",
      params: [],
    },
    {
      name: "chemistry-langmuir-coverage",
      label: "Chemistry Langmuir Coverage",
      description: "Calculate Langmuir coverage (resource binding). PV confidence: 0.88",
      params: [],
    },
    {
      name: "chemistry-nernst-potential",
      label: "Chemistry Nernst Potential",
      description: "Calculate Nernst potential (dynamic threshold). PV confidence: 0.80",
      params: [],
    },
    {
      name: "chemistry-pv-mappings",
      label: "Chemistry Pv Mappings",
      description: "Get all chemistry → PV mappings",
      params: [],
    },
    {
      name: "chemistry-saturation-rate",
      label: "Chemistry Saturation Rate",
      description: "Calculate Michaelis-Menten saturation rate. PV confidence: 0.88",
      params: [],
    },
    {
      name: "chemistry-signal-absorbance",
      label: "Chemistry Signal Absorbance",
      description: "Calculate Beer-Lambert absorbance. PV confidence: 0.75",
      params: [],
    },
    {
      name: "chemistry-threshold-exceeded",
      label: "Chemistry Threshold Exceeded",
      description: "Simple threshold exceeded check",
      params: [],
    },
    {
      name: "chemistry-threshold-rate",
      label: "Chemistry Threshold Rate",
      description: "Calculate Arrhenius rate (threshold gating). PV confidence: 0.92",
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
