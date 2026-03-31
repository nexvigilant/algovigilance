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
      name: "stem-bio-behavior-profile",
      label: "Stem Bio Behavior Profile",
      description: "Generate a behavioral modulation profile from a stimulus.",
      params: [],
    },
    {
      name: "stem-bio-tone-profile",
      label: "Stem Bio Tone Profile",
      description: "Generate a communication tone profile from a stimulus.",
      params: [],
    },
    {
      name: "stem-chem-affinity",
      label: "Stem Chem Affinity",
      description: "Create an Affinity value and classify binding strength.",
      params: [],
    },
    {
      name: "stem-chem-balance",
      label: "Stem Chem Balance",
      description: "Calculate equilibrium balance from forward and reverse rates.",
      params: [],
    },
    {
      name: "stem-chem-fraction",
      label: "Stem Chem Fraction",
      description: "Create a Fraction and check saturation status.",
      params: [],
    },
    {
      name: "stem-chem-rate",
      label: "Stem Chem Rate",
      description: "Create a Rate value and optionally compute ratio vs a second rate.",
      params: [],
    },
    {
      name: "stem-chem-ratio",
      label: "Stem Chem Ratio",
      description: "Create a Ratio value and optionally compute fold change vs a second ratio.",
      params: [],
    },
    {
      name: "stem-confidence-combine",
      label: "Stem Confidence Combine",
      description: "Combine two confidence values (multiplicative composition).",
      params: [],
    },
    {
      name: "stem-determinism-score",
      label: "Stem Determinism Score",
      description: "Classify a repeatability score on the determinism spectrum.",
      params: [],
    },
    {
      name: "stem-finance-arbitrage",
      label: "Stem Finance Arbitrage",
      description: "Detect arbitrage opportunity between two prices.",
      params: [],
    },
    {
      name: "stem-finance-compound",
      label: "Stem Finance Compound",
      description: "Compute compound growth (discrete or continuous).",
      params: [],
    },
    {
      name: "stem-finance-discount",
      label: "Stem Finance Discount",
      description: "Compute present value from a future value using the time value of money.",
      params: [],
    },
    {
      name: "stem-finance-diversify",
      label: "Stem Finance Diversify",
      description: "Compute diversification score across a portfolio of positions.",
      params: [],
    },
    {
      name: "stem-finance-exposure",
      label: "Stem Finance Exposure",
      description: "Report position exposure direction and magnitude.",
      params: [],
    },
    {
      name: "stem-finance-maturity",
      label: "Stem Finance Maturity",
      description: "Check maturity status of a time-bounded instrument.",
      params: [],
    },
    {
      name: "stem-finance-return",
      label: "Stem Finance Return",
      description: "Compute simple or log return between two prices.",
      params: [],
    },
    {
      name: "stem-finance-spread",
      label: "Stem Finance Spread",
      description: "Compute the bid-ask spread and mid price.",
      params: [],
    },
    {
      name: "stem-integrity-check",
      label: "Stem Integrity Check",
      description: "Check a value is within a min/max safety gate.",
      params: [],
    },
    {
      name: "stem-math-bounds-check",
      label: "Stem Math Bounds Check",
      description: "Check if a value is within bounds.",
      params: [],
    },
    {
      name: "stem-math-identity",
      label: "Stem Math Identity",
      description: "Check if a value is the identity element for an operation.",
      params: [],
    },
    {
      name: "stem-math-proof",
      label: "Stem Math Proof",
      description: "Construct a Proof from premises and conclusion.",
      params: [],
    },
    {
      name: "stem-math-relation-invert",
      label: "Stem Math Relation Invert",
      description: "Invert a mathematical relation.",
      params: [],
    },
    {
      name: "stem-phys-amplitude",
      label: "Stem Phys Amplitude",
      description: "Create an Amplitude value and optionally superpose with a second amplitude.",
      params: [],
    },
    {
      name: "stem-phys-conservation",
      label: "Stem Phys Conservation",
      description: "Check quantity conservation (before vs after within tolerance).",
      params: [],
    },
    {
      name: "stem-phys-fma",
      label: "Stem Phys Fma",
      description: "Calculate acceleration from force and mass (F = ma → a = F/m).",
      params: [],
    },
    {
      name: "stem-phys-inertia",
      label: "Stem Phys Inertia",
      description: "Calculate resistance to change from mass and proposed change magnitude.",
      params: [],
    },
    {
      name: "stem-phys-period",
      label: "Stem Phys Period",
      description: "Convert frequency to period (period = 1/frequency).",
      params: [],
    },
    {
      name: "stem-phys-scale",
      label: "Stem Phys Scale",
      description: "Apply a ScaleFactor to a value.",
      params: [],
    },
    {
      name: "stem-retry-budget",
      label: "Stem Retry Budget",
      description: "Calculate remaining retry budget and exhaustion status.",
      params: [],
    },
    {
      name: "stem-spatial-dimension",
      label: "Stem Spatial Dimension",
      description: "Report dimension rank and codimension relative to an ambient space.",
      params: [],
    },
    {
      name: "stem-spatial-distance",
      label: "Stem Spatial Distance",
      description: "Create a Distance value and optionally compare for approximate equality.",
      params: [],
    },
    {
      name: "stem-spatial-neighborhood",
      label: "Stem Spatial Neighborhood",
      description: "Check if a point at test_distance is contained in the neighborhood of radius.",
      params: [],
    },
    {
      name: "stem-spatial-orientation",
      label: "Stem Spatial Orientation",
      description: "Compose orientations (positive/negative/unoriented).",
      params: [],
    },
    {
      name: "stem-spatial-triangle",
      label: "Stem Spatial Triangle",
      description: "Check the triangle inequality: d(a,c) ≤ d(a,b) + d(b,c).",
      params: [],
    },
    {
      name: "stem-taxonomy",
      label: "Stem Taxonomy",
      description: "Stem Taxonomy",
      params: [],
    },
    {
      name: "stem-tier-info",
      label: "Stem Tier Info",
      description: "Get tier classification info and transfer multiplier.",
      params: [],
    },
    {
      name: "stem-transfer-confidence",
      label: "Stem Transfer Confidence",
      description: "Compute cross-domain transfer confidence from structural, functional, and contextual similarity.",
      params: [],
    },
    {
      name: "stem-version",
      label: "Stem Version",
      description: "Stem Version",
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
