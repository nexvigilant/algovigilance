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
      name: "cardio-blood-health",
      label: "Cardio Blood Health",
      description: "Assess blood health (data quality across transport).",
      params: [],
    },
    {
      name: "cardio-blood-pressure",
      label: "Cardio Blood Pressure",
      description: "Compute blood pressure (data throughput pressure).",
      params: [],
    },
    {
      name: "cardio-diagnose",
      label: "Cardio Diagnose",
      description: "Diagnose cardiovascular pathology from symptoms.",
      params: [],
    },
    {
      name: "cardio-vitals",
      label: "Cardio Vitals",
      description: "Get cardiac vitals overview.",
      params: [],
    },
    {
      name: "circulatory-health",
      label: "Circulatory Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "circulatory-pressure",
      label: "Circulatory Pressure",
      description: "Check blood pressure (queue depth vs capacity).",
      params: [],
    },
    {
      name: "circulatory-pump",
      label: "Circulatory Pump",
      description: "Pump data through the circulatory system with routing.",
      params: [],
    },
    {
      name: "digestive-health",
      label: "Digestive Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "digestive-process",
      label: "Digestive Process",
      description: "Process data through the full digestive pipeline (mouth → stomach → intestine → liver).",
      params: [],
    },
    {
      name: "digestive-taste",
      label: "Digestive Taste",
      description: "Taste (quality assess) input data before full processing.",
      params: [],
    },
    {
      name: "integumentary-health",
      label: "Integumentary Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "integumentary-permission",
      label: "Integumentary Permission",
      description: "Evaluate permission cascade for an action.",
      params: [],
    },
    {
      name: "integumentary-sandbox",
      label: "Integumentary Sandbox",
      description: "Check sandbox isolation layers.",
      params: [],
    },
    {
      name: "integumentary-scarring",
      label: "Integumentary Scarring",
      description: "Check scarring mechanisms (learned restrictions from past incidents).",
      params: [],
    },
    {
      name: "integumentary-settings",
      label: "Integumentary Settings",
      description: "Analyze settings precedence stack.",
      params: [],
    },
    {
      name: "lymphatic-drainage",
      label: "Lymphatic Drainage",
      description: "Analyze drainage capacity (overflow management).",
      params: [],
    },
    {
      name: "lymphatic-health",
      label: "Lymphatic Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "lymphatic-inspect",
      label: "Lymphatic Inspect",
      description: "Inspect a node in the lymphatic network.",
      params: [],
    },
    {
      name: "lymphatic-thymic",
      label: "Lymphatic Thymic",
      description: "Run thymic selection on a candidate (quality gate).",
      params: [],
    },
    {
      name: "muscular-classify",
      label: "Muscular Classify",
      description: "Classify a tool by muscle type following the Size Principle.",
      params: [],
    },
    {
      name: "muscular-fatigue",
      label: "Muscular Fatigue",
      description: "Check fatigue level for the current session.",
      params: [],
    },
    {
      name: "muscular-health",
      label: "Muscular Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "nervous-health",
      label: "Nervous Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "nervous-latency",
      label: "Nervous Latency",
      description: "Measure signal latency through a processing chain.",
      params: [],
    },
    {
      name: "nervous-myelination",
      label: "Nervous Myelination",
      description: "Check myelination status (compiled Rust hooks vs shell scripts).",
      params: [],
    },
    {
      name: "nervous-reflex",
      label: "Nervous Reflex",
      description: "Analyze a reflex arc (trigger → response pattern).",
      params: [],
    },
    {
      name: "reproductive-guard-mutation",
      label: "Reproductive Guard Mutation",
      description: "Checks if a proposed code change (mutation) is architectural lethal.",
      params: [],
    },
    {
      name: "reproductive-specialize-agent",
      label: "Reproductive Specialize Agent",
      description: "Gets parameters for a specialized subagent tissue phenotype.",
      params: [],
    },
    {
      name: "reproductive-start-mitosis",
      label: "Reproductive Start Mitosis",
      description: "Initializes a mitotic repair cycle for a failing crate.",
      params: [],
    },
    {
      name: "respiratory-dead-space",
      label: "Respiratory Dead Space",
      description: "Detect dead space in context (wasted tokens).",
      params: [],
    },
    {
      name: "respiratory-exchange",
      label: "Respiratory Exchange",
      description: "Analyze gas exchange (useful info extracted from context).",
      params: [],
    },
    {
      name: "respiratory-health",
      label: "Respiratory Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "respiratory-tidal",
      label: "Respiratory Tidal",
      description: "Measure tidal volume (per-turn context usage).",
      params: [],
    },
    {
      name: "skeletal-health",
      label: "Skeletal Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "skeletal-structure",
      label: "Skeletal Structure",
      description: "Get project skeleton structure snapshot.",
      params: [],
    },
    {
      name: "skeletal-wolffs-law",
      label: "Skeletal Wolffs Law",
      description: "Evaluate Wolff's Law reinforcement needs.",
      params: [],
    },
    {
      name: "urinary-expiry",
      label: "Urinary Expiry",
      description: "Check session expiry status.",
      params: [],
    },
    {
      name: "urinary-health",
      label: "Urinary Health",
      description: "Get respiratory system health overview.",
      params: [],
    },
    {
      name: "urinary-pruning",
      label: "Urinary Pruning",
      description: "Analyze telemetry pruning needs.",
      params: [],
    },
    {
      name: "urinary-retention",
      label: "Urinary Retention",
      description: "Evaluate retention policy compliance.",
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
