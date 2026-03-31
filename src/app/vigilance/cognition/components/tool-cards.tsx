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
      name: "cognition-analyze",
      label: "Cognition Analyze",
      description: "/// Returns the cognitive profile: entropy, sparsity, utilization, peak attention.",
      params: [],
    },
    {
      name: "cognition-confidence",
      label: "Cognition Confidence",
      description: "/// Confidence = max(softmax(logits)) — probability mass on top choice.",
      params: [],
    },
    {
      name: "cognition-embed",
      label: "Cognition Embed",
      description: "/// Returns the embedding vectors for each token in the input.",
      params: [],
    },
    {
      name: "cognition-entropy",
      label: "Cognition Entropy",
      description: "/// H(p) = -Σ pᵢ · log₂(pᵢ)",
      params: [],
    },
    {
      name: "cognition-forward",
      label: "Cognition Forward",
      description: "per-layer attention entropy, and predicted token with confidence.",
      params: [],
    },
    {
      name: "cognition-perplexity",
      label: "Cognition Perplexity",
      description: "/// Perplexity = exp(-1/N · Σ log(p(tokenᵢ)))",
      params: [],
    },
    {
      name: "cognition-process",
      label: "Cognition Process",
      description: "(for composability with cognition_perplexity), and attention profile.",
      params: [],
    },
    {
      name: "cognition-sample",
      label: "Cognition Sample",
      description: "/// Supports temperature, top-k, top-p, and repetition penalty.",
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
