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
      name: "train",
      label: "Train",
      description: "Train a decision tree classifier from labeled data. Returns the fitted tree as JSON for use with predict/prune/export. U",
      params: ["features", "labels"],
    },
    {
      name: "predict",
      label: "Predict",
      description: "Run prediction on a fitted decision tree. Pass the tree_json from train and a feature vector. Use when classifying new d",
      params: ["tree_json", "features"],
    },
    {
      name: "feature-importance",
      label: "Feature Importance",
      description: "Get feature importance scores from a fitted tree. Returns weighted impurity decrease per feature. Use when understanding",
      params: ["tree_json"],
    },
    {
      name: "prune",
      label: "Prune",
      description: "Cost-complexity prune a fitted tree. Reduces overfitting by removing low-value splits. Use when a tree is too deep or co",
      params: ["tree_json"],
    },
    {
      name: "info",
      label: "Info",
      description: "Get summary statistics for a fitted tree without modifying it. Use when inspecting tree structure.",
      params: ["tree_json"],
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
