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
      name: "conservation-check",
      label: "Conservation Check",
      description: "Validate ∃ = ∂(×(ς, ∅)) for a system. Inputs: boundary sharpness ∂ ∈ [0,1], state richness ς ∈ [0,1], void clarity ∅ ∈ [",
      params: ["boundary", "state", "void"],
    },
    {
      name: "helix-position",
      label: "Helix Position",
      description: "Compute position on the knowledge helix. Five turns: 0=Primitives (alphabet), 1=Conservation (grammar), 2=Crystalbook (l",
      params: ["turn"],
    },
    {
      name: "mutualism-test",
      label: "Mutualism Test",
      description: "Test whether an action satisfies the mutualism constraint: does it produce ∃ for self WITHOUT reducing ∃ for others? Con",
      params: ["existence_self_before", "existence_self_after", "existence_other_before", "existence_other_after"],
    },
    {
      name: "encode",
      label: "Encode",
      description: "Encode a concept through all 5 helix turns. Given a concept name and its primitives, returns the encoding at each altitu",
      params: ["concept", "primitives", "boundary", "state", "void"],
    },
    {
      name: "advance",
      label: "Advance",
      description: "Advance one turn on the helix. Given current turn and state, compute what the next turn requires. The truth doesn't chan",
      params: ["current_turn", "current_existence", "current_boundary", "current_state"],
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
