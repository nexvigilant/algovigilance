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
      name: "search-guidelines",
      label: "Search Guidelines",
      description: "Search ICH guidelines by topic, code, or keyword",
      params: ["query"],
    },
    {
      name: "get-guideline",
      label: "Get Guideline",
      description: "Get ICH guideline summary and current step by code",
      params: ["code"],
    },
    {
      name: "get-pv-guidelines",
      label: "Get Pv Guidelines",
      description: "Get all pharmacovigilance-related guidelines (E2x series)",
      params: [],
    },
    {
      name: "get-meddra-guidelines",
      label: "Get Meddra Guidelines",
      description: "Get MedDRA-related ICH guidelines and terminology references",
      params: [],
    },
    {
      name: "get-safety-guidelines",
      label: "Get Safety Guidelines",
      description: "Get ICH Safety (S-series) guidelines — nonclinical safety pharmacology, carcinogenicity, genotoxicity, reproductive toxi",
      params: [],
    },
    {
      name: "get-quality-guidelines",
      label: "Get Quality Guidelines",
      description: "Get ICH Quality (Q-series) guidelines — stability testing, analytical validation, impurities, QbD, lifecycle management",
      params: [],
    },
    {
      name: "get-e2b-data-elements",
      label: "Get E2B Data Elements",
      description: "Get ICH E2B(R3) ICSR data element categories — administrative info, patient data, drug info, reaction/event, narrative s",
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
