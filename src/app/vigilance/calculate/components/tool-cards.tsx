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
      name: "compute-prr",
      label: "Compute Prr",
      description: "Compute Proportional Reporting Ratio (PRR) for a drug-event pair from a 2x2 contingency table. PRR > 2 with chi-squared ",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "compute-ror",
      label: "Compute Ror",
      description: "Compute Reporting Odds Ratio (ROR) for a drug-event pair from a 2x2 contingency table. ROR > 1 with lower 95% CI > 1 ind",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "compute-ic",
      label: "Compute Ic",
      description: "Compute Information Component (IC/BCPNN) for a drug-event pair. IC > 0 with IC025 (lower credibility interval) > 0 indic",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "compute-ebgm",
      label: "Compute Ebgm",
      description: "Compute Empirical Bayesian Geometric Mean (EBGM/GPS) for a drug-event pair. EBGM > 2 with EB05 (lower bound) > 1 indicat",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "assess-naranjo-causality",
      label: "Assess Naranjo Causality",
      description: "Compute Naranjo adverse drug reaction probability score (0-13). Categories: Definite (>=9), Probable (5-8), Possible (1-",
      params: ["previous_reports", "after_drug", "improved_on_withdrawal", "reappeared_on_rechallenge", "alternative_causes", "placebo_reaction", "drug_detected", "dose_related", "previous_exposure", "objective_evidence"],
    },
    {
      name: "classify-seriousness",
      label: "Classify Seriousness",
      description: "Classify adverse event seriousness per ICH E2A criteria. An event is serious if it meets ANY criterion: death, life-thre",
      params: ["resulted_in_death", "life_threatening", "required_hospitalization", "resulted_in_disability", "congenital_anomaly", "medically_important"],
    },
    {
      name: "compute-benefit-risk",
      label: "Compute Benefit Risk",
      description: "Compute a quantitative benefit-risk ratio using the AlgoVigilance QBR framework. Scores benefit (efficacy × population imp",
      params: ["efficacy_score", "population_impact", "risk_severity", "risk_frequency", "risk_detectability"],
    },
    {
      name: "compute-disproportionality-table",
      label: "Compute Disproportionality Table",
      description: "Compute ALL four disproportionality measures (PRR, ROR, IC, EBGM) simultaneously from a single 2x2 contingency table. Re",
      params: ["a", "b", "c", "d"],
    },
    {
      name: "assess-who-umc-causality",
      label: "Assess Who Umc Causality",
      description: "Assess drug-event causality using the WHO-UMC system. Categories: Certain, Probable/Likely, Possible, Unlikely, Conditio",
      params: ["temporal_relationship", "known_response", "dechallenge_positive", "rechallenge_positive", "alternative_explanation", "sufficient_information"],
    },
    {
      name: "compute-reporting-rate",
      label: "Compute Reporting Rate",
      description: "Compute adverse event reporting rate per unit exposure. Normalizes raw case counts by exposure denominator (prescription",
      params: ["case_count", "exposure_denominator", "denominator_unit"],
    },
    {
      name: "compute-signal-half-life",
      label: "Compute Signal Half Life",
      description: "Compute signal persistence using exponential decay model. Estimates how long a safety signal remains actionable based on",
      params: ["initial_signal_strength", "decay_rate"],
    },
    {
      name: "compute-expectedness",
      label: "Compute Expectedness",
      description: "Assess whether an adverse event is expected (listed) or unexpected (unlisted) based on reference safety information. Une",
      params: ["event_term", "drug_name"],
    },
    {
      name: "compute-time-to-onset",
      label: "Compute Time To Onset",
      description: "Analyze time-to-onset patterns using Weibull distribution. Shape parameter k indicates: k<1 early hazard (direct pharmac",
      params: ["onset_days"],
    },
    {
      name: "score-case-completeness",
      label: "Score Case Completeness",
      description: "Score ICSR completeness against E2B(R3) minimum data elements. Checks required fields (patient, reporter, drug, event) a",
      params: ["patient_identifier", "reporter_identifier", "suspect_drug", "adverse_event"],
    },
    {
      name: "compute-number-needed-harm",
      label: "Compute Number Needed Harm",
      description: "Compute Number Needed to Harm (NNH) from exposed and unexposed incidence rates. NNH = 1/ARI where ARI = |risk_exposed - ",
      params: ["risk_exposed", "risk_unexposed"],
    },
    {
      name: "compute-confidence-interval",
      label: "Compute Confidence Interval",
      description: "Compute Wilson score confidence interval for a proportion. More reliable than Wald CI for small samples and extreme prop",
      params: ["successes", "total"],
    },
    {
      name: "compute-signal-trend",
      label: "Compute Signal Trend",
      description: "Detect trend direction in time-series safety signal scores using linear regression. Reports slope, R-squared, and whethe",
      params: ["observations"],
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
