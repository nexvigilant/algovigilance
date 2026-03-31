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
      name: "compound-cache-count",
      label: "Compound Cache Count",
      description: "Count total compounds in the local cache.",
      params: [],
    },
    {
      name: "compound-cache-get",
      label: "Compound Cache Get",
      description: "Get a specific compound from cache by exact name.",
      params: [],
    },
    {
      name: "compound-cache-search",
      label: "Compound Cache Search",
      description: "Search cached compounds by partial name match.",
      params: [],
    },
    {
      name: "compound-detect",
      label: "Compound Detect",
      description: "Detect compound growth phase and bottleneck from time-series snapshots.",
      params: [],
    },
    {
      name: "compound-growth",
      label: "Compound Growth",
      description: "If params given: return projection result showing velocity gain from that investment.",
      params: [],
    },
    {
      name: "compound-resolve",
      label: "Compound Resolve",
      description: "Sync wrapper: uses block_in_place because CacheStore (rusqlite) is !Send.",
      params: [],
    },
    {
      name: "compound-resolve-batch",
      label: "Compound Resolve Batch",
      description: "Sync wrapper: uses block_in_place because CacheStore (rusqlite) is !Send.",
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
