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
      name: "compute-qbri",
      label: "Compute Qbri",
      description: "Compute the Quantitative Benefit-Risk Index (QBRI) from benefit and risk parameters. QBRI = (B × Pb × Ub) / (R × Pr × Sr",
      params: ["benefit_effect", "benefit_pvalue", "unmet_need", "risk_signal", "risk_probability", "risk_severity"],
    },
    {
      name: "derive-qbri-thresholds",
      label: "Derive Qbri Thresholds",
      description: "Derive optimal QBRI decision thresholds (tau_approve, tau_monitor, tau_uncertain) from historical FDA drug approval deci",
      params: [],
    },
    {
      name: "qbri-equation",
      label: "Qbri Equation",
      description: "Get the QBRI equation with variable definitions and hypothesis thresholds. Reference tool — explains what each term mean",
      params: [],
    },
    {
      name: "compute-qbr",
      label: "Compute Qbr",
      description: "Compute full statistical benefit-risk ratio from contingency tables using disproportionality analysis (PRR/ROR/IC/EBGM).",
      params: ["method", "benefit_tables", "risk_tables"],
    },
    {
      name: "compute-qbr-simple",
      label: "Compute Qbr Simple",
      description: "Quick benefit-risk ratio from one benefit and one risk contingency table. Returns the B/R ratio, individual signal stren",
      params: ["method", "benefit_table", "risk_table"],
    },
    {
      name: "compute-therapeutic-window",
      label: "Compute Therapeutic Window",
      description: "Compute therapeutic window from efficacy and toxicity dose-response curves using Hill equation integration. Returns the ",
      params: ["efficacy", "toxicity"],
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
