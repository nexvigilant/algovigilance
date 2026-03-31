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
      name: "search-safety-communications",
      label: "Search Safety Communications",
      description: "Search FDA drug safety communications by drug or topic",
      params: ["query"],
    },
    {
      name: "get-medwatch-alerts",
      label: "Get Medwatch Alerts",
      description: "Get recent MedWatch safety alerts",
      params: [],
    },
    {
      name: "get-boxed-warning",
      label: "Get Boxed Warning",
      description: "Get current boxed warning text for a drug",
      params: ["drug_name"],
    },
    {
      name: "get-safety-labeling-changes",
      label: "Get Safety Labeling Changes",
      description: "Get recent safety-related labeling changes (SLCs)",
      params: [],
    },
    {
      name: "get-recall-classification",
      label: "Get Recall Classification",
      description: "Get recall classification breakdown — Class I (serious/death), Class II (temporary), Class III (unlikely harm)",
      params: ["drug_name"],
    },
    {
      name: "get-serious-outcomes",
      label: "Get Serious Outcomes",
      description: "Get serious outcome distribution from FAERS — death, hospitalization, life-threatening, disability",
      params: ["drug_name"],
    },
    {
      name: "get-rems-info",
      label: "Get Rems Info",
      description: "Get REMS (Risk Evaluation and Mitigation Strategy) information — medication guides, ETASU, communication plans",
      params: ["drug_name"],
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
