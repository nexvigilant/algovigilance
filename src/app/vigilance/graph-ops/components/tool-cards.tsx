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
      name: "aggregate-fold",
      label: "Aggregate Fold",
      description: "Run all standard folds (sum, count, min, max, mean, variance) in one pass.",
      params: [],
    },
    {
      name: "aggregate-outliers",
      label: "Aggregate Outliers",
      description: "Detect outliers using the IQR method.",
      params: [],
    },
    {
      name: "aggregate-percentile",
      label: "Aggregate Percentile",
      description: "Compute a specific percentile from values.",
      params: [],
    },
    {
      name: "aggregate-rank",
      label: "Aggregate Rank",
      description: "Rank items by value, optionally returning only top N.",
      params: [],
    },
    {
      name: "aggregate-tree-fold",
      label: "Aggregate Tree Fold",
      description: "Parse a JSON tree and perform recursive fold.",
      params: [],
    },
    {
      name: "dag-publish-dry-run",
      label: "Dag Publish Dry Run",
      description: "No cargo invocations — purely a DAG computation.",
      params: [],
    },
    {
      name: "dag-publish-plan",
      label: "Dag Publish Plan",
      description: "once all prior phases are complete.",
      params: [],
    },
    {
      name: "dag-publish-status",
      label: "Dag Publish Status",
      description: "referenced against the checkpoint file to produce a pending list.",
      params: [],
    },
    {
      name: "graph-analyze",
      label: "Graph Analyze",
      description: "Analyze a graph structure.",
      params: [],
    },
    {
      name: "graph-centrality",
      label: "Graph Centrality",
      description: "Compute betweenness centrality for all nodes",
      params: [],
    },
    {
      name: "graph-components",
      label: "Graph Components",
      description: "Find connected components (treating edges as undirected)",
      params: [],
    },
    {
      name: "graph-construct",
      label: "Graph Construct",
      description: "Construct a graph from various data sources.",
      params: [],
    },
    {
      name: "graph-layout-converge",
      label: "Graph Layout Converge",
      description: "Supports 2D and 3D layout, normalizes positions to [-1, 1].",
      params: [],
    },
    {
      name: "graph-shortest-path",
      label: "Graph Shortest Path",
      description: "Find shortest path between two nodes (BFS, unweighted)",
      params: [],
    },
    {
      name: "topo-betti",
      label: "Topo Betti",
      description: "Compute Betti numbers at a specific filtration value",
      params: [],
    },
    {
      name: "topo-persistence",
      label: "Topo Persistence",
      description: "Compute persistent homology from a distance matrix",
      params: [],
    },
    {
      name: "topo-vietoris-rips",
      label: "Topo Vietoris Rips",
      description: "Build a Vietoris-Rips complex and return its structure",
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
