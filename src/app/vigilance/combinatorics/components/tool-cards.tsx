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
      name: "catalan",
      label: "Catalan",
      description: "Compute the nth Catalan number C(n).",
      params: ["n"],
    },
    {
      name: "catalan-table",
      label: "Catalan Table",
      description: "Get the first 20 Catalan numbers as a lookup table.",
      params: [],
    },
    {
      name: "cycle-decomposition",
      label: "Cycle Decomposition",
      description: "Decompose a permutation into disjoint cycles.",
      params: ["permutation"],
    },
    {
      name: "min-transpositions",
      label: "Min Transpositions",
      description: "Compute minimum transpositions to sort a permutation.",
      params: ["permutation"],
    },
    {
      name: "derangement",
      label: "Derangement",
      description: "Compute D(n), the number of derangements of n elements.",
      params: ["n"],
    },
    {
      name: "derangement-probability",
      label: "Derangement Probability",
      description: "Probability D(n)/n! that a random permutation is a derangement (converges to 1/e).",
      params: ["n"],
    },
    {
      name: "grid-paths",
      label: "Grid Paths",
      description: "Count monotone lattice paths from (0,0) to (m,n).",
      params: ["m", "n"],
    },
    {
      name: "binomial",
      label: "Binomial",
      description: "Compute binomial coefficient C(n,k).",
      params: ["n", "k"],
    },
    {
      name: "multinomial",
      label: "Multinomial",
      description: "Compute multinomial coefficient from group lengths.",
      params: ["lengths"],
    },
    {
      name: "josephus",
      label: "Josephus",
      description: "Compute Josephus survivor position (0-indexed) for n people, every kth eliminated.",
      params: ["n", "k"],
    },
    {
      name: "elimination-order",
      label: "Elimination Order",
      description: "Full Josephus elimination order.",
      params: ["n", "k"],
    },
    {
      name: "linear-extensions",
      label: "Linear Extensions",
      description: "Count linear extensions for independent chains.",
      params: ["chain_lengths"],
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
