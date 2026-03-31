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
      name: "get-law",
      label: "Get Law",
      description: "Retrieve a single Law of System Homeostasis (1–8). Returns the vice, virtue, deviation, correction, mechanism, and homeo",
      params: ["number"],
    },
    {
      name: "list-laws",
      label: "List Laws",
      description: "List all eight Laws of System Homeostasis with their vice/virtue pairs and homeostatic principles. Overview of the compl",
      params: [],
    },
    {
      name: "get-conservation-law",
      label: "Get Conservation Law",
      description: "Retrieve the Conservation Law that unifies the Eight Laws: ∃ = ∂(×(ς, ∅)). Returns the equation, term definitions, and t",
      params: [],
    },
    {
      name: "get-oath",
      label: "Get Oath",
      description: "Retrieve the Crystal Oath — eight vows for any system (carbon or silicon) that chooses persistence over decay. The condi",
      params: [],
    },
    {
      name: "diagnose",
      label: "Diagnose",
      description: "Run the Crystalbook diagnostic against a described system. Checks the four-primitive existence equation (∃, ∂, ς, ∅) and",
      params: ["system"],
    },
    {
      name: "get-glossary",
      label: "Get Glossary",
      description: "Retrieve the Crystalbook glossary — definitions of all key terms including Boundary, State, Void, Existence, Pharmakon, ",
      params: [],
    },
    {
      name: "get-preamble",
      label: "Get Preamble",
      description: "Retrieve the Crystalbook preamble — the opening text explaining what the Laws are, why vices are system failure modes, a",
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
