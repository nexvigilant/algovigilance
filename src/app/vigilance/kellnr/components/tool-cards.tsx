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
      name: "kellnr-add-owner",
      label: "Kellnr Add Owner",
      description: "Add a user as owner of a crate.",
      params: [],
    },
    {
      name: "kellnr-compute-dtree-feature-importance",
      label: "Kellnr Compute Dtree Feature Importance",
      description: "Kellnr Compute Dtree Feature Importance",
      params: [],
    },
    {
      name: "kellnr-compute-dtree-prune",
      label: "Kellnr Compute Dtree Prune",
      description: "Cost-complexity pruning analysis.",
      params: [],
    },
    {
      name: "kellnr-compute-dtree-to-rules",
      label: "Kellnr Compute Dtree To Rules",
      description: "Kellnr Compute Dtree To Rules",
      params: [],
    },
    {
      name: "kellnr-compute-graph-betweenness",
      label: "Kellnr Compute Graph Betweenness",
      description: "Kellnr Compute Graph Betweenness",
      params: [],
    },
    {
      name: "kellnr-compute-graph-mutual-info",
      label: "Kellnr Compute Graph Mutual Info",
      description: "Kellnr Compute Graph Mutual Info",
      params: [],
    },
    {
      name: "kellnr-compute-graph-tarjan-scc",
      label: "Kellnr Compute Graph Tarjan Scc",
      description: "Kellnr Compute Graph Tarjan Scc",
      params: [],
    },
    {
      name: "kellnr-compute-graph-topsort",
      label: "Kellnr Compute Graph Topsort",
      description: "Topological sort (Kahn's algorithm). Returns error if cycle detected.",
      params: [],
    },
    {
      name: "kellnr-compute-pk-auc",
      label: "Kellnr Compute Pk Auc",
      description: "AUC via trapezoidal rule (linear or log-linear).",
      params: [],
    },
    {
      name: "kellnr-compute-pk-clearance",
      label: "Kellnr Compute Pk Clearance",
      description: "Clearance: CL = (F * Dose) / AUC.",
      params: [],
    },
    {
      name: "kellnr-compute-pk-ionization",
      label: "Kellnr Compute Pk Ionization",
      description: "Henderson-Hasselbalch ionization.",
      params: [],
    },
    {
      name: "kellnr-compute-pk-michaelis-menten",
      label: "Kellnr Compute Pk Michaelis Menten",
      description: "Kellnr Compute Pk Michaelis Menten",
      params: [],
    },
    {
      name: "kellnr-compute-pk-steady-state",
      label: "Kellnr Compute Pk Steady State",
      description: "Kellnr Compute Pk Steady State",
      params: [],
    },
    {
      name: "kellnr-compute-pk-volume-distribution",
      label: "Kellnr Compute Pk Volume Distribution",
      description: "Kellnr Compute Pk Volume Distribution",
      params: [],
    },
    {
      name: "kellnr-compute-signal-cusum",
      label: "Kellnr Compute Signal Cusum",
      description: "CUSUM control chart.",
      params: [],
    },
    {
      name: "kellnr-compute-signal-sprt",
      label: "Kellnr Compute Signal Sprt",
      description: "Sequential Probability Ratio Test (SPRT).",
      params: [],
    },
    {
      name: "kellnr-compute-signal-weibull-tto",
      label: "Kellnr Compute Signal Weibull Tto",
      description: "Kellnr Compute Signal Weibull Tto",
      params: [],
    },
    {
      name: "kellnr-compute-stats-bayesian-posterior",
      label: "Kellnr Compute Stats Bayesian Posterior",
      description: "Kellnr Compute Stats Bayesian Posterior",
      params: [],
    },
    {
      name: "kellnr-compute-stats-entropy",
      label: "Kellnr Compute Stats Entropy",
      description: "Shannon entropy: H = -sum(p_i * log2(p_i)).",
      params: [],
    },
    {
      name: "kellnr-compute-stats-ols-regression",
      label: "Kellnr Compute Stats Ols Regression",
      description: "Kellnr Compute Stats Ols Regression",
      params: [],
    },
    {
      name: "kellnr-compute-stats-poisson-ci",
      label: "Kellnr Compute Stats Poisson Ci",
      description: "Kellnr Compute Stats Poisson Ci",
      params: [],
    },
    {
      name: "kellnr-compute-stats-welch-ttest",
      label: "Kellnr Compute Stats Welch Ttest",
      description: "Kellnr Compute Stats Welch Ttest",
      params: [],
    },
    {
      name: "kellnr-compute-thermo-arrhenius",
      label: "Kellnr Compute Thermo Arrhenius",
      description: "Kellnr Compute Thermo Arrhenius",
      params: [],
    },
    {
      name: "kellnr-compute-thermo-binding-affinity",
      label: "Kellnr Compute Thermo Binding Affinity",
      description: "Kellnr Compute Thermo Binding Affinity",
      params: [],
    },
    {
      name: "kellnr-compute-thermo-gibbs",
      label: "Kellnr Compute Thermo Gibbs",
      description: "Gibbs free energy: delta_G = delta_H - T * delta_S.",
      params: [],
    },
    {
      name: "kellnr-compute-thermo-kd",
      label: "Kellnr Compute Thermo Kd",
      description: "Dissociation constant from Gibbs free energy: Kd = exp(delta_G / RT).",
      params: [],
    },
    {
      name: "kellnr-download-crate",
      label: "Kellnr Download Crate",
      description: "Kellnr Download Crate",
      params: [],
    },
    {
      name: "kellnr-get-crate-metadata",
      label: "Kellnr Get Crate Metadata",
      description: "Kellnr Get Crate Metadata",
      params: [],
    },
    {
      name: "kellnr-get-dependencies",
      label: "Kellnr Get Dependencies",
      description: "Kellnr Get Dependencies",
      params: [],
    },
    {
      name: "kellnr-get-dependents",
      label: "Kellnr Get Dependents",
      description: "Kellnr Get Dependents",
      params: [],
    },
    {
      name: "kellnr-get-version-details",
      label: "Kellnr Get Version Details",
      description: "Kellnr Get Version Details",
      params: [],
    },
    {
      name: "kellnr-health-check",
      label: "Kellnr Health Check",
      description: "Kellnr Health Check",
      params: [],
    },
    {
      name: "kellnr-list-all-crates",
      label: "Kellnr List All Crates",
      description: "Kellnr List All Crates",
      params: [],
    },
    {
      name: "kellnr-list-crate-versions",
      label: "Kellnr List Crate Versions",
      description: "Kellnr List Crate Versions",
      params: [],
    },
    {
      name: "kellnr-list-owners",
      label: "Kellnr List Owners",
      description: "List crate owners (users and teams).",
      params: [],
    },
    {
      name: "kellnr-registry-stats",
      label: "Kellnr Registry Stats",
      description: "Kellnr Registry Stats",
      params: [],
    },
    {
      name: "kellnr-remove-owner",
      label: "Kellnr Remove Owner",
      description: "Remove an owner from a crate.",
      params: [],
    },
    {
      name: "kellnr-search-crates",
      label: "Kellnr Search Crates",
      description: "Search crates by name, keyword, or description.",
      params: [],
    },
    {
      name: "kellnr-unyank-version",
      label: "Kellnr Unyank Version",
      description: "Kellnr Unyank Version",
      params: [],
    },
    {
      name: "kellnr-yank-version",
      label: "Kellnr Yank Version",
      description: "Mark a version as unavailable (yank).",
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
