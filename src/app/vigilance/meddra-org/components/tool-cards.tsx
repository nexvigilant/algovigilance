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
      name: "search-terms",
      label: "Search Terms",
      description: "Search MedDRA terms across all hierarchy levels (SOC, HLGT, HLT, PT, LLT)",
      params: ["query"],
    },
    {
      name: "get-term-hierarchy",
      label: "Get Term Hierarchy",
      description: "Get the full MedDRA hierarchy path for a preferred term",
      params: ["preferred_term"],
    },
    {
      name: "get-soc-terms",
      label: "Get Soc Terms",
      description: "List all Preferred Terms under a System Organ Class",
      params: ["soc"],
    },
    {
      name: "get-smq",
      label: "Get Smq",
      description: "Get Standardised MedDRA Query terms for a safety topic",
      params: ["smq_name"],
    },
    {
      name: "get-hierarchy-overview",
      label: "Get Hierarchy Overview",
      description: "Get complete MedDRA hierarchy structure — 5 levels (LLT→PT→HLT→HLGT→SOC) with counts, relationships, and multi-axiality",
      params: [],
    },
    {
      name: "get-version-info",
      label: "Get Version Info",
      description: "Get MedDRA version information, biannual update cycle, and MSSO maintenance organization details",
      params: [],
    },
    {
      name: "get-multiaxiality-guide",
      label: "Get Multiaxiality Guide",
      description: "Get MedDRA multi-axiality guidance — how PTs map to multiple SOCs with primary/secondary designation and impact on signa",
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
