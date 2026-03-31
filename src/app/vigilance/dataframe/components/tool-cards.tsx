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
      name: "create",
      label: "Create",
      description: "Create a DataFrame from JSON column data. Input: object mapping column names to arrays of values. Returns schema and row",
      params: ["columns"],
    },
    {
      name: "describe",
      label: "Describe",
      description: "Compute summary statistics for a numeric column: count, non_null, mean, std_dev, min, max, median. Provide the full Data",
      params: ["columns", "column"],
    },
    {
      name: "filter",
      label: "Filter",
      description: "Filter rows where a column meets a condition. Operators: eq, neq, gt, gte, lt, lte, contains (string substring). Returns",
      params: ["columns", "column", "operator", "value"],
    },
    {
      name: "group-by",
      label: "Group By",
      description: "Group rows by one or more columns and compute aggregations. Agg types: sum, mean, min, max, count, first, last, n_unique",
      params: ["columns", "group_cols", "aggs"],
    },
    {
      name: "sort",
      label: "Sort",
      description: "Sort a DataFrame by a column. Returns sorted rows as JSON.",
      params: ["columns", "by"],
    },
    {
      name: "select",
      label: "Select",
      description: "Select a subset of columns from a DataFrame, optionally dropping columns instead.",
      params: ["columns"],
    },
    {
      name: "join",
      label: "Join",
      description: "Join two DataFrames on shared key columns. Join types: inner, left, right, outer, semi, anti. Provide left and right Dat",
      params: ["left", "right", "on"],
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
