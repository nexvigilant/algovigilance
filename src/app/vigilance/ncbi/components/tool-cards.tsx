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
      name: "ncbi-efetch",
      label: "Ncbi Efetch",
      description: "Retrieve full records for a list of NCBI UIDs in various formats.",
      params: [],
    },
    {
      name: "ncbi-elink",
      label: "Ncbi Elink",
      description: "Find linked records across NCBI databases.",
      params: [],
    },
    {
      name: "ncbi-esearch",
      label: "Ncbi Esearch",
      description: "Search NCBI databases for UIDs matching a query.",
      params: [],
    },
    {
      name: "ncbi-esummary",
      label: "Ncbi Esummary",
      description: "Retrieve summaries for a list of NCBI UIDs.",
      params: [],
    },
    {
      name: "ncbi-search-and-fetch",
      label: "Ncbi Search And Fetch",
      description: "Search then fetch FASTA records in one call.",
      params: [],
    },
    {
      name: "ncbi-search-and-summarize",
      label: "Ncbi Search And Summarize",
      description: "Search then summarize in one call (faster than full fetch).",
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
