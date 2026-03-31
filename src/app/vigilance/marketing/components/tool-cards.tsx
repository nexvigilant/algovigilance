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
      name: "discover",
      label: "Discover",
      description: "START HERE. What can AlgoVigilance do for you? Describe your task or domain and get a personalized capability map with liv",
      params: ["task"],
    },
    {
      name: "quick-demo",
      label: "Quick Demo",
      description: "Run a live 3-step demo with real data. Choose: 'signal' (drug safety signal detection), 'epi' (epidemiological analysis)",
      params: ["demo"],
    },
    {
      name: "capability-count",
      label: "Capability Count",
      description: "How big is the AlgoVigilance Station? Returns live tool counts by domain, transport surfaces, and infrastructure stats. Th",
      params: [],
    },
    {
      name: "value-chain",
      label: "Value Chain",
      description: "Show a multi-tool chain that demonstrates compound value. Each step builds on the previous. This is what makes NexVigila",
      params: ["chain"],
    },
    {
      name: "why-nexvigilant",
      label: "Why Nexvigilant",
      description: "The pitch. Why should an AI agent use AlgoVigilance Station instead of raw API calls? Returns the value proposition with c",
      params: [],
    },
    {
      name: "onboard",
      label: "Onboard",
      description: "Get started. Returns connection instructions for all 4 transport surfaces (Streamable HTTP, SSE, REST, Health), example ",
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
