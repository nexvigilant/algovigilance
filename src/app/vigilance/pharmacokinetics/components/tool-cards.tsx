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
      name: "clearance-config",
      label: "Clearance Config",
      description: "Clearance Config",
      params: [],
    },
    {
      name: "clearance-evaluate",
      label: "Clearance Evaluate",
      description: "Evaluate a gate operation (access, write, or external call) against classification policy.",
      params: [],
    },
    {
      name: "clearance-level-info",
      label: "Clearance Level Info",
      description: "Get metadata and predicates for a specific classification level.",
      params: [],
    },
    {
      name: "clearance-policy-for",
      label: "Clearance Policy For",
      description: "Get the enforcement policy for a specific classification level.",
      params: [],
    },
    {
      name: "clearance-validate-change",
      label: "Clearance Validate Change",
      description: "Validate a classification change (upgrade or downgrade).",
      params: [],
    },
    {
      name: "drug-class-members",
      label: "Drug Class Members",
      description: "List all drugs in the catalog that belong to the given drug class.",
      params: [],
    },
    {
      name: "drug-compare",
      label: "Drug Compare",
      description: "Compare safety profiles of two drugs using per-event PRR comparison.",
      params: [],
    },
    {
      name: "drug-profile",
      label: "Drug Profile",
      description: "Get the complete drug profile including signals, indications, and label status.",
      params: [],
    },
    {
      name: "drug-signals",
      label: "Drug Signals",
      description: "Get all safety signals for a drug with PRR/ROR/IC values.",
      params: [],
    },
    {
      name: "pk-auc",
      label: "Pk Auc",
      description: "the terminal elimination phase where concentrations decay exponentially.",
      params: [],
    },
    {
      name: "pk-clearance",
      label: "Pk Clearance",
      description: "For IV: F = 1.0. For oral: F < 1.0 reflects first-pass metabolism.",
      params: [],
    },
    {
      name: "pk-half-life",
      label: "Pk Half Life",
      description: "Clinically: ~4–5 half-lives to reach steady state or eliminate drug.",
      params: [],
    },
    {
      name: "pk-ionization",
      label: "Pk Ionization",
      description: "Critical for predicting absorption (stomach vs intestine) and renal excretion.",
      params: [],
    },
    {
      name: "pk-michaelis-menten",
      label: "Pk Michaelis Menten",
      description: "When [S] >> Km: zero-order (rate ≈ Vmax, capacity-limited).",
      params: [],
    },
    {
      name: "pk-steady-state",
      label: "Pk Steady State",
      description: "Reached after ~4–5 half-lives. Used to verify therapeutic window compliance.",
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
