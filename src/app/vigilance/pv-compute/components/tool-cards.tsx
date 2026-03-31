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
      name: "pv-axioms-domain-dashboard",
      label: "Pv Axioms Domain Dashboard",
      description: "Domain dashboard with KSB counts, regulation counts, and coverage.",
      params: [],
    },
    {
      name: "pv-axioms-ksb-lookup",
      label: "Pv Axioms Ksb Lookup",
      description: "Look up KSBs by ID, domain, type, or keyword.",
      params: [],
    },
    {
      name: "pv-axioms-query",
      label: "Pv Axioms Query",
      description: "Raw SQL query (read-only, max 100 rows).",
      params: [],
    },
    {
      name: "pv-axioms-regulation-search",
      label: "Pv Axioms Regulation Search",
      description: "Search regulations by text, jurisdiction, or domain.",
      params: [],
    },
    {
      name: "pv-axioms-traceability-chain",
      label: "Pv Axioms Traceability Chain",
      description: "Trace axiom → parameter → pipeline stage → Rust coverage.",
      params: [],
    },
    {
      name: "pv-chi-square",
      label: "Pv Chi Square",
      description: "Calculate Chi-square",
      params: [],
    },
    {
      name: "pv-control-loop-tick",
      label: "Pv Control Loop Tick",
      description: "Run one iteration of the PV control loop",
      params: [],
    },
    {
      name: "pv-core-bayesian-beta-binomial",
      label: "Pv Core Bayesian Beta Binomial",
      description: "Returns posterior mean, variance, 95% credible interval, and confidence score.",
      params: [],
    },
    {
      name: "pv-core-bayesian-gamma-poisson",
      label: "Pv Core Bayesian Gamma Poisson",
      description: "Returns posterior mean rate, variance, and confidence score.",
      params: [],
    },
    {
      name: "pv-core-bayesian-sequential",
      label: "Pv Core Bayesian Sequential",
      description: "Pv Core Bayesian Sequential",
      params: [],
    },
    {
      name: "pv-core-cox",
      label: "Pv Core Cox",
      description: "Returns hazard ratios, confidence intervals, and Measured confidence per coefficient.",
      params: [],
    },
    {
      name: "pv-core-cumulative-incidence",
      label: "Pv Core Cumulative Incidence",
      description: "Pv Core Cumulative Incidence",
      params: [],
    },
    {
      name: "pv-core-fdr-adjust",
      label: "Pv Core Fdr Adjust",
      description: "Standalone tool — works with p-values from any statistical analysis.",
      params: [],
    },
    {
      name: "pv-core-hazard-ratio",
      label: "Pv Core Hazard Ratio",
      description: "Wraps a single-covariate Cox model internally.",
      params: [],
    },
    {
      name: "pv-core-ivf-assess",
      label: "Pv Core Ivf Assess",
      description: "Assess all 5 IVF axioms for an intervention (ToV §35)",
      params: [],
    },
    {
      name: "pv-core-ivf-axioms",
      label: "Pv Core Ivf Axioms",
      description: "List the 5 IVF axioms with ToV mappings and formal statements",
      params: [],
    },
    {
      name: "pv-core-kaplan-meier",
      label: "Pv Core Kaplan Meier",
      description: "Greenwood SE, log-log CI, median survival, and per-point confidence scores.",
      params: [],
    },
    {
      name: "pv-core-log-rank",
      label: "Pv Core Log Rank",
      description: "significance flag, and overall confidence score.",
      params: [],
    },
    {
      name: "pv-core-severity-assess",
      label: "Pv Core Severity Assess",
      description: "Assess adverse event severity using Hartwig-Siegel scale (levels 1-7)",
      params: [],
    },
    {
      name: "pv-embedding-get",
      label: "Pv Embedding Get",
      description: "/// Returns the sparse TF-IDF vector, graph neighbors, and metadata.",
      params: [],
    },
    {
      name: "pv-embedding-similarity",
      label: "Pv Embedding Similarity",
      description: "Works for both ICH terms and free-text queries.",
      params: [],
    },
    {
      name: "pv-embedding-stats",
      label: "Pv Embedding Stats",
      description: "`pv_embedding_stats` — Index statistics for the PV embedding system.",
      params: [],
    },
    {
      name: "pv-naranjo-quick",
      label: "Pv Naranjo Quick",
      description: "Naranjo causality assessment",
      params: [],
    },
    {
      name: "pv-pipeline",
      label: "Pv Pipeline",
      description: "5. Return unified results with recommendations",
      params: [],
    },
    {
      name: "pv-qbri-compute",
      label: "Pv Qbri Compute",
      description: "Compute QBRI from benefit and risk parameters.",
      params: [],
    },
    {
      name: "pv-qbri-derive",
      label: "Pv Qbri Derive",
      description: "Derive optimal QBRI thresholds from historical FDA decisions.",
      params: [],
    },
    {
      name: "pv-qbri-equation",
      label: "Pv Qbri Equation",
      description: "Pv Qbri Equation",
      params: [],
    },
    {
      name: "pv-signal-chart",
      label: "Pv Signal Chart",
      description: "Returns `McpError::internal_error` if the plotters renderer fails.",
      params: [],
    },
    {
      name: "pv-signal-complete",
      label: "Pv Signal Complete",
      description: "Complete signal analysis with all algorithms",
      params: [],
    },
    {
      name: "pv-signal-cooperative",
      label: "Pv Signal Cooperative",
      description: "coincidental. Above ~40%, it's likely mechanistic.",
      params: [],
    },
    {
      name: "pv-signal-ebgm",
      label: "Pv Signal Ebgm",
      description: "Calculate EBGM",
      params: [],
    },
    {
      name: "pv-signal-ic",
      label: "Pv Signal Ic",
      description: "Calculate IC",
      params: [],
    },
    {
      name: "pv-signal-prr",
      label: "Pv Signal Prr",
      description: "Calculate PRR",
      params: [],
    },
    {
      name: "pv-signal-ror",
      label: "Pv Signal Ror",
      description: "Calculate ROR",
      params: [],
    },
    {
      name: "pv-signal-strength",
      label: "Pv Signal Strength",
      description: "Calculate signal strength S = U × R × T (ToV Core Equation §20)",
      params: [],
    },
    {
      name: "pv-taxonomy-chomsky",
      label: "Pv Taxonomy Chomsky",
      description: "Get Chomsky classification for a PV subsystem.",
      params: [],
    },
    {
      name: "pv-taxonomy-composite",
      label: "Pv Taxonomy Composite",
      description: "Look up a T2-C composite by name.",
      params: [],
    },
    {
      name: "pv-taxonomy-concept",
      label: "Pv Taxonomy Concept",
      description: "Look up a T3 concept by pillar and name.",
      params: [],
    },
    {
      name: "pv-taxonomy-lex-symbols",
      label: "Pv Taxonomy Lex Symbols",
      description: "Pv Taxonomy Lex Symbols",
      params: [],
    },
    {
      name: "pv-taxonomy-primitive",
      label: "Pv Taxonomy Primitive",
      description: "Look up a T2-P primitive by name.",
      params: [],
    },
    {
      name: "pv-taxonomy-summary",
      label: "Pv Taxonomy Summary",
      description: "Get the full PV taxonomy summary (T1/T2-P/T2-C/T3 counts).",
      params: [],
    },
    {
      name: "pv-taxonomy-transfer",
      label: "Pv Taxonomy Transfer",
      description: "Look up cross-domain transfer confidence for a target domain.",
      params: [],
    },
    {
      name: "pv-taxonomy-transfer-matrix",
      label: "Pv Taxonomy Transfer Matrix",
      description: "Pv Taxonomy Transfer Matrix",
      params: [],
    },
    {
      name: "pv-taxonomy-who-pillars",
      label: "Pv Taxonomy Who Pillars",
      description: "Pv Taxonomy Who Pillars",
      params: [],
    },
    {
      name: "pv-who-umc-quick",
      label: "Pv Who Umc Quick",
      description: "WHO-UMC causality assessment",
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
