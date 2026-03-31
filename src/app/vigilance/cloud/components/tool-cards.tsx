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
      name: "cloud-anomaly-detect",
      label: "Cloud Anomaly Detect",
      description: "cloud_anomaly_detect — Type + observed → drift detection.",
      params: [],
    },
    {
      name: "cloud-architecture-advisor",
      label: "Cloud Architecture Advisor",
      description: "cloud_architecture_advisor — Primitives + constraints → ranked recommendations.",
      params: [],
    },
    {
      name: "cloud-capacity-project",
      label: "Cloud Capacity Project",
      description: "cloud_capacity_project — Pure computation: utilization projection over time.",
      params: [],
    },
    {
      name: "cloud-compare-types",
      label: "Cloud Compare Types",
      description: "cloud_compare_types — Two types → overlap, unique-to-each, Jaccard.",
      params: [],
    },
    {
      name: "cloud-dominant-shift",
      label: "Cloud Dominant Shift",
      description: "character.",
      params: [],
    },
    {
      name: "cloud-infra-map",
      label: "Cloud Infra Map",
      description: "cloud_infra_map — Single instance → full model with composition overlay.",
      params: [],
    },
    {
      name: "cloud-infra-status",
      label: "Cloud Infra Status",
      description: "cloud_infra_status — GCE instance list mapped through cloud primitives.",
      params: [],
    },
    {
      name: "cloud-list-types",
      label: "Cloud List Types",
      description: "cloud_list_types — Inventory of all 35 types, filterable by tier.",
      params: [],
    },
    {
      name: "cloud-molecular-weight",
      label: "Cloud Molecular Weight",
      description: "dedicated molecular_weight tool group.",
      params: [],
    },
    {
      name: "cloud-primitive-composition",
      label: "Cloud Primitive Composition",
      description: "cloud_primitive_composition — Type name → full primitive composition + transfers.",
      params: [],
    },
    {
      name: "cloud-reverse-synthesize",
      label: "Cloud Reverse Synthesize",
      description: "cloud_reverse_synthesize — Primitives → ranked cloud type matches.",
      params: [],
    },
    {
      name: "cloud-reverse-transfer",
      label: "Cloud Reverse Transfer",
      description: "cloud_reverse_transfer — Domain concept → matching cloud types.",
      params: [],
    },
    {
      name: "cloud-supervisor-health",
      label: "Cloud Supervisor Health",
      description: "cloud_supervisor_health — Nexcloud supervisor status through cloud primitives.",
      params: [],
    },
    {
      name: "cloud-tier-classify",
      label: "Cloud Tier Classify",
      description: "cloud_tier_classify — Primitive names → tier classification.",
      params: [],
    },
    {
      name: "cloud-transfer-chain",
      label: "Cloud Transfer Chain",
      description: "cloud_transfer_chain — Multi-hop BFS across transfer graph.",
      params: [],
    },
    {
      name: "cloud-transfer-confidence",
      label: "Cloud Transfer Confidence",
      description: "Compute cross-domain transfer confidence from structural, functional, and contextual similarity.",
      params: [],
    },
    {
      name: "cloud-transfer-matrix",
      label: "Cloud Transfer Matrix",
      description: "cloud_transfer_matrix — Full type×domain confidence matrix.",
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
