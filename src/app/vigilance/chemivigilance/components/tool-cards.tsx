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
      name: "parse-smiles",
      label: "Parse Smiles",
      description: "Parse a SMILES string and return molecular graph info (atom count, bond count, connected components).",
      params: ["smiles"],
    },
    {
      name: "descriptors",
      label: "Descriptors",
      description: "Calculate Lipinski/physicochemical molecular descriptors: MW, LogP, TPSA, HBA, HBD, rotatable bonds, rings. Includes Rul",
      params: ["smiles"],
    },
    {
      name: "fingerprint",
      label: "Fingerprint",
      description: "Generate a Morgan/ECFP circular fingerprint with configurable radius and bit count.",
      params: ["smiles"],
    },
    {
      name: "similarity",
      label: "Similarity",
      description: "Compute Tanimoto and Dice similarity between two molecules using Morgan fingerprints.",
      params: ["smiles_a", "smiles_b"],
    },
    {
      name: "structural-alerts",
      label: "Structural Alerts",
      description: "Scan a molecule for structural alerts (toxicophores) using the ICH M7 alert library. Returns matched alerts with categor",
      params: ["smiles"],
    },
    {
      name: "predict-toxicity",
      label: "Predict Toxicity",
      description: "Predict toxicity using QSAR models based on molecular structure and structural alert count.",
      params: ["smiles"],
    },
    {
      name: "predict-metabolites",
      label: "Predict Metabolites",
      description: "Predict Phase I/II metabolites from molecular structure. Returns a metabolite tree.",
      params: ["smiles"],
    },
    {
      name: "safety-brief",
      label: "Safety Brief",
      description: "Generate a comprehensive safety brief for a molecule: descriptors, structural alerts, toxicity predictions, and metaboli",
      params: ["smiles"],
    },
    {
      name: "substructure",
      label: "Substructure",
      description: "Check if a query substructure exists in a target molecule. Returns match count.",
      params: ["smiles", "query"],
    },
    {
      name: "alert-library",
      label: "Alert Library",
      description: "List all structural alerts in the ICH M7 library with names, categories, and descriptions.",
      params: [],
    },
    {
      name: "ring-scan",
      label: "Ring Scan",
      description: "Find the Smallest Set of Smallest Rings (SSSR) in a molecule. Returns ring sizes and atom indices.",
      params: ["smiles"],
    },
    {
      name: "aromaticity",
      label: "Aromaticity",
      description: "Detect aromatic rings and count π electrons per ring using Hückel's rule.",
      params: ["smiles"],
    },
    {
      name: "molecular-formula",
      label: "Molecular Formula",
      description: "Get molecular weight and heavy atom count from SMILES.",
      params: ["smiles"],
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
