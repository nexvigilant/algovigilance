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
      name: "word-align-up",
      label: "Word Align Up",
      description: "Align value up to next power-of-two boundary.",
      params: [],
    },
    {
      name: "word-analyze",
      label: "Word Analyze",
      description: "Comprehensive binary word analysis.",
      params: [],
    },
    {
      name: "word-binary-gcd",
      label: "Word Binary Gcd",
      description: "Binary GCD (Stein's algorithm).",
      params: [],
    },
    {
      name: "word-bit-test",
      label: "Word Bit Test",
      description: "Test a specific bit position.",
      params: [],
    },
    {
      name: "word-hamming-distance",
      label: "Word Hamming Distance",
      description: "Hamming distance between two binary words.",
      params: [],
    },
    {
      name: "word-isqrt",
      label: "Word Isqrt",
      description: "Integer square root (Newton's method).",
      params: [],
    },
    {
      name: "word-log2",
      label: "Word Log2",
      description: "Floor log base 2.",
      params: [],
    },
    {
      name: "word-parity",
      label: "Word Parity",
      description: "Parity check (even/odd set bit count).",
      params: [],
    },
    {
      name: "word-popcount",
      label: "Word Popcount",
      description: "Count set bits (population count).",
      params: [],
    },
    {
      name: "word-rotate",
      label: "Word Rotate",
      description: "Rotate a binary word left or right.",
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
