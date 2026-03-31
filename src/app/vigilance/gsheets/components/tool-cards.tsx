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
      name: "gsheets-append",
      label: "Gsheets Append",
      description: "Append rows to the end of a table.",
      params: [],
    },
    {
      name: "gsheets-batch-read",
      label: "Gsheets Batch Read",
      description: "Read multiple cell ranges in one call.",
      params: [],
    },
    {
      name: "gsheets-list-sheets",
      label: "Gsheets List Sheets",
      description: "List all sheet tabs in a Google Spreadsheet.",
      params: [],
    },
    {
      name: "gsheets-metadata",
      label: "Gsheets Metadata",
      description: "Get spreadsheet metadata.",
      params: [],
    },
    {
      name: "gsheets-read-range",
      label: "Gsheets Read Range",
      description: "Read a cell range from a Google Spreadsheet.",
      params: [],
    },
    {
      name: "gsheets-search",
      label: "Gsheets Search",
      description: "Search for a substring across all cells in a range.",
      params: [],
    },
    {
      name: "gsheets-write-range",
      label: "Gsheets Write Range",
      description: "Write values to a cell range.",
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
