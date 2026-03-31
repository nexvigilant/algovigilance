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
      name: "translate-codon",
      label: "Translate Codon",
      description: "Translate a 3-nucleotide codon (e.g., 'ATG') to its amino acid using the standard genetic code. ATG = Methionine (start ",
      params: ["codon"],
    },
    {
      name: "codon-degeneracy",
      label: "Codon Degeneracy",
      description: "Get the degeneracy (number of codons encoding the same amino acid) for a given amino acid. Leucine has 6 codons (most de",
      params: ["amino_acid"],
    },
    {
      name: "align-sequences",
      label: "Align Sequences",
      description: "Align two DNA sequences using Smith-Waterman (local) or Needleman-Wunsch (global) algorithm. Returns alignment score, al",
      params: ["query", "target"],
    },
    {
      name: "assemble",
      label: "Assemble",
      description: "Assemble DNA assembly language source code into a Program. The DNA ISA uses 4-base instructions encoding operations on a",
      params: ["source"],
    },
    {
      name: "evolve",
      label: "Evolve",
      description: "Run genetic algorithm evolution from seed DNA sequences toward a target word. Simulates natural selection with mutation,",
      params: ["seeds", "target"],
    },
    {
      name: "codon-table",
      label: "Codon Table",
      description: "Return the complete standard genetic code — all 64 codons mapped to their amino acids. The Rosetta Stone of molecular bi",
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
