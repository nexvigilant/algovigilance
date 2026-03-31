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
      name: "encode",
      label: "Encode",
      description: "Encode a concept and its definition as a balanced primitive equation. Returns the equation, balance status, and display ",
      params: ["concept", "definition"],
    },
    {
      name: "decode",
      label: "Decode",
      description: "Decode a balanced equation back to a Jeopardy-style 'What is X?' answer.",
      params: ["equation_json"],
    },
    {
      name: "sisters",
      label: "Sisters",
      description: "Find sister concepts with overlapping primitive compositions via Jaccard similarity.",
      params: ["concept"],
    },
    {
      name: "mass-state",
      label: "Mass State",
      description: "Compute thermodynamic mass state for a concept — entropy, Gibbs free energy, equilibrium status, depleted/saturated prim",
      params: ["concept"],
    },
    {
      name: "dictionary",
      label: "Dictionary",
      description: "List or search the built-in PV term dictionary. Action 'list' returns all terms; 'search' filters by primitive name.",
      params: ["action"],
    },
    {
      name: "is-balanced",
      label: "Is Balanced",
      description: "Check if a balanced equation satisfies primitive conservation. Returns balance status and per-primitive deficit.",
      params: ["equation_json"],
    },
    {
      name: "prove",
      label: "Prove",
      description: "Generate a balance proof showing reactant/product mass conservation with per-primitive inventories.",
      params: ["equation_json"],
    },
    {
      name: "is-isomer",
      label: "Is Isomer",
      description: "Check if two equations are isomers (same primitive set, different dominant). Returns isomer status and Jaccard similarit",
      params: ["equation_a_json", "equation_b_json"],
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
