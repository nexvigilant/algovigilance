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
      name: "fhir-adverse-event-to-signal",
      label: "Fhir Adverse Event To Signal",
      description: "Parse a FHIR AdverseEvent JSON and convert to a SignalInput for PV signal detection.",
      params: [],
    },
    {
      name: "fhir-batch-to-signals",
      label: "Fhir Batch To Signals",
      description: "Batch convert multiple FHIR AdverseEvent JSONs to SignalInputs.",
      params: [],
    },
    {
      name: "fhir-parse-bundle",
      label: "Fhir Parse Bundle",
      description: "Parse a FHIR Bundle JSON and extract resource summaries.",
      params: [],
    },
    {
      name: "fhir-validate-resource",
      label: "Fhir Validate Resource",
      description: "Validate a FHIR resource JSON structure (checks required fields, resourceType).",
      params: [],
    },
    {
      name: "guidelines-categories",
      label: "Guidelines Categories",
      description: "Guidelines Categories",
      params: [],
    },
    {
      name: "guidelines-get",
      label: "Guidelines Get",
      description: "Get a specific hormone level",
      params: [],
    },
    {
      name: "guidelines-pv-all",
      label: "Guidelines Pv All",
      description: "Guidelines Pv All",
      params: [],
    },
    {
      name: "guidelines-search",
      label: "Guidelines Search",
      description: "Search documents by query string",
      params: [],
    },
    {
      name: "guidelines-url",
      label: "Guidelines Url",
      description: "Get URL for a guideline",
      params: [],
    },
    {
      name: "ich-guideline",
      label: "Ich Guideline",
      description: "Get ICH guideline metadata by ID (e.g., \"E2A\", \"Q9\")",
      params: [],
    },
    {
      name: "ich-lookup",
      label: "Ich Lookup",
      description: "Look up an ICH/CIOMS term by name (O(1) PHF lookup + cached formatting)",
      params: [],
    },
    {
      name: "ich-search",
      label: "Ich Search",
      description: "Search ICH glossary terms by keyword or phrase",
      params: [],
    },
    {
      name: "ich-stats",
      label: "Ich Stats",
      description: "Ich Stats",
      params: [],
    },
    {
      name: "regulatory-effectiveness-assess",
      label: "Regulatory Effectiveness Assess",
      description: "Assess FDA effectiveness endpoint for approval pathway compatibility",
      params: [],
    },
    {
      name: "regulatory-primitives-audit",
      label: "Regulatory Primitives Audit",
      description: "Run a full code inspection audit on a file or directory.",
      params: [],
    },
    {
      name: "regulatory-primitives-compare",
      label: "Regulatory Primitives Compare",
      description: "Compare models for a specific task.",
      params: [],
    },
    {
      name: "regulatory-primitives-extract",
      label: "Regulatory Primitives Extract",
      description: "Extract primitives from regulatory source",
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
