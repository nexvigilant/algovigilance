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
      name: "ccim-assess",
      label: "Ccim Assess",
      description: "Assess current CCIM state: NCRR, FIRE progress.",
      params: [],
    },
    {
      name: "ccim-equation",
      label: "Ccim Equation",
      description: "Compute C(d) using the CCIM compound interest equation.",
      params: [],
    },
    {
      name: "ccim-project",
      label: "Ccim Project",
      description: "Project capability trajectory over N directives.",
      params: [],
    },
    {
      name: "commandment-audit",
      label: "Commandment Audit",
      description: "Full audit of all 15 commandments",
      params: [],
    },
    {
      name: "commandment-info",
      label: "Commandment Info",
      description: "Get information about a commandment",
      params: [],
    },
    {
      name: "commandment-list",
      label: "Commandment List",
      description: "List commandments by category",
      params: [],
    },
    {
      name: "commandment-verify",
      label: "Commandment Verify",
      description: "Verify a single commandment against proof",
      params: [],
    },
    {
      name: "integrity-analyze",
      label: "Integrity Analyze",
      description: "Full integrity analysis with optional Bloom/domain/threshold configuration.",
      params: [],
    },
    {
      name: "integrity-assess-ksb",
      label: "Integrity Assess Ksb",
      description: "Convenience KSB response assessment with required Bloom level.",
      params: [],
    },
    {
      name: "integrity-calibration",
      label: "Integrity Calibration",
      description: "Get domain calibration profile with baseline feature expectations.",
      params: [],
    },
    {
      name: "principles-get",
      label: "Principles Get",
      description: "Get a specific principle by name",
      params: [],
    },
    {
      name: "principles-list",
      label: "Principles List",
      description: "List all available principles",
      params: [],
    },
    {
      name: "principles-search",
      label: "Principles Search",
      description: "Search principles by keyword",
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
