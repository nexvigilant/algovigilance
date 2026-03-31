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
      name: "guardian-actuators-list",
      label: "Guardian Actuators List",
      description: "List all registered actuators",
      params: [],
    },
    {
      name: "guardian-adversarial-input",
      label: "Guardian Adversarial Input",
      description: "Guardian Adversarial Input",
      params: [],
    },
    {
      name: "guardian-ceiling-for-originator",
      label: "Guardian Ceiling For Originator",
      description: "Get autonomy-aware ceiling limits for an originator type",
      params: [],
    },
    {
      name: "guardian-evaluate-pv",
      label: "Guardian Evaluate Pv",
      description: "Evaluate PV risk context and get recommended responses",
      params: [],
    },
    {
      name: "guardian-history",
      label: "Guardian History",
      description: "Get Guardian event history",
      params: [],
    },
    {
      name: "guardian-homeostasis-tick",
      label: "Guardian Homeostasis Tick",
      description: "Run one iteration of the homeostasis control loop",
      params: [],
    },
    {
      name: "guardian-inject-signal",
      label: "Guardian Inject Signal",
      description: "Inject a test signal into the Guardian system",
      params: [],
    },
    {
      name: "guardian-originator-classify",
      label: "Guardian Originator Classify",
      description: "Classify an entity by its {G, V, R} capabilities",
      params: [],
    },
    {
      name: "guardian-reset",
      label: "Guardian Reset",
      description: "Guardian Reset",
      params: [],
    },
    {
      name: "guardian-sensors-list",
      label: "Guardian Sensors List",
      description: "List all registered sensors",
      params: [],
    },
    {
      name: "guardian-space3d-compute",
      label: "Guardian Space3D Compute",
      description: "Compute a point in 3D safety space",
      params: [],
    },
    {
      name: "guardian-status",
      label: "Guardian Status",
      description: "Check PHAROS status: existing reports, timer state.",
      params: [],
    },
    {
      name: "guardian-subscribe",
      label: "Guardian Subscribe",
      description: "Subscribe to Guardian events (polling snapshot)",
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
