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
      name: "harm-probability",
      label: "Harm Probability",
      description: "Compute combined harm probability from a chain of propagation probabilities. Under Axiom 5 (Markov), ℙ(H|δs₁) = ∏ᵢP_{i→i",
      params: ["probabilities"],
    },
    {
      name: "exponential-harm",
      label: "Exponential Harm",
      description: "Compute harm probability using exponential decay formula ℙ(H) = e^{-α(H-1)} where α is the attenuation rate and H is the",
      params: ["alpha", "harm_level"],
    },
    {
      name: "protective-depth",
      label: "Protective Depth",
      description: "Compute minimum protective depth H such that ℙ(H) < target_probability. Formula: H ≥ 1 + log(1/ε)/α. Answers: 'how many ",
      params: ["target_probability", "attenuation_rate"],
    },
    {
      name: "verify-attenuation",
      label: "Verify Attenuation",
      description: "Verify the attenuation property holds: harm probability strictly decreases with each additional protective layer. Return",
      params: ["probabilities"],
    },
    {
      name: "attenuation-rate",
      label: "Attenuation Rate",
      description: "Compute the attenuation rate α = -log(P̄) where P̄ is the geometric mean of propagation probabilities. Higher α means st",
      params: ["probabilities"],
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
