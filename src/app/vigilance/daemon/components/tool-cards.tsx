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
      name: "get-work-queue",
      label: "Get Work Queue",
      description: "Get the current ranked work queue produced by the Development Daemon candidate scanner. Returns up to 10 candidates scor",
      params: [],
    },
    {
      name: "get-momentum",
      label: "Get Momentum",
      description: "Get the Development Daemon momentum streak and recent completions. Shows how many consecutive tasks have been completed ",
      params: [],
    },
    {
      name: "get-last-verdict",
      label: "Get Last Verdict",
      description: "Get the last session's autopsy verdict. Shows whether the previous session fully demonstrated, partially demonstrated, o",
      params: [],
    },
    {
      name: "get-daemon-status",
      label: "Get Daemon Status",
      description: "Get the Development Daemon overall status: trigger enabled, next run time, scanner health, and system integration state.",
      params: [],
    },
    {
      name: "get-system-health",
      label: "Get System Health",
      description: "Get the AIP-10 system health score (0-100, grade A-F). Composite of queue depth, sigma verdict rate, momentum streak, an",
      params: [],
    },
    {
      name: "get-aip-inventory",
      label: "Get Aip Inventory",
      description: "List all 10 Autonomous Intelligence Programs with their type (remote/local), surface, and status.",
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
