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
      name: "relative-risk",
      label: "Relative Risk",
      description: "Compute relative risk RR = [a/(a+b)] / [c/(c+d)] with 95% CI. PV equivalent: PRR.",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "odds-ratio",
      label: "Odds Ratio",
      description: "Compute odds ratio OR = (a*d)/(b*c) with 95% CI. PV equivalent: ROR.",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "attributable-risk",
      label: "Attributable Risk",
      description: "Compute attributable risk AR = Ie - Io (risk difference) with 95% CI.",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "nnt-nnh",
      label: "Nnt Nnh",
      description: "Compute Number Needed to Treat (NNT) or Number Needed to Harm (NNH) = 1/|AR|.",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "attributable-fraction",
      label: "Attributable Fraction",
      description: "Compute attributable fraction AF = (RR-1)/RR among exposed.",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "population-af",
      label: "Population Af",
      description: "Compute population attributable fraction PAF = Pe(RR-1)/[1+Pe(RR-1)].",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "incidence-rate",
      label: "Incidence Rate",
      description: "Compute incidence rate IR = events/person-time with Poisson CI.",
      params: ["events", "person_time"],
    },
    {
      name: "prevalence",
      label: "Prevalence",
      description: "Compute prevalence P = cases/population with Wilson CI.",
      params: ["cases", "population"],
    },
    {
      name: "kaplan-meier",
      label: "Kaplan Meier",
      description: "Kaplan-Meier product-limit survival estimator S(t) = Π[1 - d_i/n_i] with Greenwood SE.",
      params: ["intervals"],
    },
    {
      name: "smr",
      label: "Smr",
      description: "Standardized Mortality/Morbidity Ratio SMR = observed/expected with Byar CI. PV equivalent: O/E ratio.",
      params: ["observed", "expected"],
    },
    {
      name: "pv-mappings",
      label: "Pv Mappings",
      description: "Reference table of all epidemiology-to-pharmacovigilance concept transfer mappings with confidence scores.",
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
