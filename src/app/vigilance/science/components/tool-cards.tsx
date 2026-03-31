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
      name: "get-ptefb-pathway",
      label: "Get Ptefb Pathway",
      description: "Get interactive PTEFb pathway diagram showing HEXIM1 inhibition of P-TEFb kinase complex, CDK9/CyclinT1 interaction, and",
      params: [],
    },
    {
      name: "search-bet-inhibitors",
      label: "Search Bet Inhibitors",
      description: "Search BET bromodomain inhibitor data including JQ1, I-BET151, OTX015 — mechanism of action, selectivity profiles, and H",
      params: [],
    },
    {
      name: "search-hdac-inhibitors",
      label: "Search Hdac Inhibitors",
      description: "Search HDAC inhibitor data including vorinostat, panobinostat, romidepsin — epigenetic mechanisms and HEXIM1 expression ",
      params: [],
    },
    {
      name: "get-biomarker-validation",
      label: "Get Biomarker Validation",
      description: "Get HEXIM1 biomarker validation data — expression levels across tissues, disease associations, and validation status for",
      params: [],
    },
    {
      name: "mine-geo-expression",
      label: "Mine Geo Expression",
      description: "Mine NCBI GEO for HEXIM1 gene expression datasets — differential expression under drug treatment, tissue-specific profil",
      params: [],
    },
    {
      name: "get-hypothesis-tracker",
      label: "Get Hypothesis Tracker",
      description: "Get current hypothesis status board — active research hypotheses, evidence for/against, confidence levels, and next expe",
      params: [],
    },
    {
      name: "get-replication-failures",
      label: "Get Replication Failures",
      description: "Get documented replication failures and negative results from HEXIM1 research — what didn't work and why, to prevent red",
      params: [],
    },
    {
      name: "get-ifn-pathway",
      label: "Get Ifn Pathway",
      description: "Get interferon pathway analysis — HEXIM1 role in IFN signaling, antiviral response, and immune modulation via P-TEFb reg",
      params: [],
    },
    {
      name: "get-experimental-protocols",
      label: "Get Experimental Protocols",
      description: "Get validated experimental protocols for HEXIM1 research — ChIP-seq, RT-qPCR, Western blot conditions, cell line recomme",
      params: [],
    },
    {
      name: "get-patent-landscape",
      label: "Get Patent Landscape",
      description: "Get HEXIM1-related patent landscape — existing IP, white space analysis, freedom-to-operate assessment, and strategic fi",
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
