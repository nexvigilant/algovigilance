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
      name: "evaluate",
      label: "Evaluate",
      description: "Evaluate ζ(s) at a complex point s = σ + it. Returns real and imaginary parts of the result. Uses Euler-Maclaurin summat",
      params: ["sigma", "t"],
    },
    {
      name: "find-zeros",
      label: "Find Zeros",
      description: "Find zeros of ζ(s) on the critical line (σ=1/2) between t_low and t_high. Returns a list of zero locations with refined ",
      params: ["t_low", "t_high"],
    },
    {
      name: "verify-rh",
      label: "Verify Rh",
      description: "Verify the Riemann Hypothesis up to a given height T on the critical line. Counts expected vs found zeros and checks for",
      params: ["height"],
    },
    {
      name: "z-function",
      label: "Z Function",
      description: "Evaluate the Riemann-Siegel Z function Z(t), which is real-valued on the critical line. Sign changes of Z(t) indicate ze",
      params: ["t"],
    },
    {
      name: "gue-comparison",
      label: "Gue Comparison",
      description: "Compare zero spacings against GUE (Gaussian Unitary Ensemble) random matrix theory predictions. Tests the Montgomery-Odl",
      params: ["t_low", "t_high"],
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
