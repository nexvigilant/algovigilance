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
      name: "run-pv-signal-to-action",
      label: "Run Pv Signal To Action",
      description: "Run the core PV workflow chain: PRR signal detection → causality bridge → Naranjo assessment → regulatory action routing",
      params: ["prr", "naranjo_score", "is_serious"],
    },
    {
      name: "run-case-assessment-pipeline",
      label: "Run Case Assessment Pipeline",
      description: "Run the complete case assessment chain: case validity → seriousness classification → causality evidence → regulatory act",
      params: ["prr", "naranjo_score", "is_serious"],
    },
    {
      name: "run-benefit-risk-assessment",
      label: "Run Benefit Risk Assessment",
      description: "Run the benefit-risk assessment chain: weighs therapeutic benefit against safety risk using PRR, Naranjo, NNH, and thera",
      params: ["prr", "naranjo_score", "is_serious"],
    },
    {
      name: "run-prr-signal",
      label: "Run Prr Signal",
      description: "Classify a PRR value as signal/no-signal using Evans (2001) criteria. PRR >= 2.0 = signal.",
      params: ["prr"],
    },
    {
      name: "run-naranjo-quick",
      label: "Run Naranjo Quick",
      description: "Quick Naranjo causality assessment from a score. Returns causality category (DEFINITE/PROBABLE/POSSIBLE/DOUBTFUL) with c",
      params: ["naranjo_score"],
    },
    {
      name: "run-case-seriousness",
      label: "Run Case Seriousness",
      description: "Classify case seriousness per ICH E2A criteria. Returns seriousness category, expedited reporting requirement, and deadl",
      params: ["is_serious"],
    },
    {
      name: "run-workflow-router",
      label: "Run Workflow Router",
      description: "Route a PV case to the appropriate workflow based on case characteristics. Returns workflow type, priority, and first ac",
      params: ["is_serious"],
    },
    {
      name: "list-micrograms",
      label: "List Micrograms",
      description: "List all available micrograms with their descriptions and test counts.",
      params: [],
    },
    {
      name: "list-chains",
      label: "List Chains",
      description: "List all available microgram chains with their step sequences.",
      params: [],
    },
    {
      name: "run-station-dailymed-pipeline",
      label: "Run Station Dailymed Pipeline",
      description: "DailyMed ADR label data → risk tier → causality routing. Pipe get-adverse-reactions output fields directly into this cha",
      params: ["has_boxed_warning", "has_rems", "serious_reactions_count", "total_reactions_count"],
    },
    {
      name: "run-station-pubmed-pipeline",
      label: "Run Station Pubmed Pipeline",
      description: "PubMed signal literature → evidence strength → causality routing. Pipe search-signal-literature output into this chain t",
      params: ["total_articles", "case_report_count", "systematic_review_count", "recent_count", "has_regulatory_citation"],
    },
    {
      name: "run-station-openvigil-pipeline",
      label: "Run Station Openvigil Pipeline",
      description: "OpenVigil disproportionality → signal triage → causality routing. Pipe compute-disproportionality output fields into thi",
      params: ["prr", "prr_ci_lower", "ror", "ror_ci_lower", "ic", "case_count"],
    },
    {
      name: "run-station-trial-pipeline",
      label: "Run Station Trial Pipeline",
      description: "Clinical trial SAE data → safety concern triage → causality routing. Pipe compare-trial-arms or get-serious-adverse-even",
      params: ["treatment_sae_rate", "control_sae_rate", "total_saes", "has_deaths", "phase"],
    },
    {
      name: "run-station-drugbank-pipeline",
      label: "Run Station Drugbank Pipeline",
      description: "DrugBank DDI data → interaction severity → causality routing. Pipe get-interactions output into this chain to get a clin",
      params: ["interaction_count", "cyp_inhibition", "narrow_ti_involved"],
    },
    {
      name: "run-station-rxnav-pipeline",
      label: "Run Station Rxnav Pipeline",
      description: "RxNav drug interaction data → interaction severity → signal routing. Pipe get-interactions output into this chain to cla",
      params: ["interaction_count", "has_contraindication", "has_serious", "has_moderate"],
    },
    {
      name: "run-station-recall-pipeline",
      label: "Run Station Recall Pipeline",
      description: "FDA recall data → recall severity classification → regulatory action routing. Pipe search-recalls or get-recall-classifi",
      params: ["recall_class", "is_ongoing", "distribution_scope"],
    },
    {
      name: "run-seriousness-to-deadline",
      label: "Run Seriousness To Deadline",
      description: "ICH E2A seriousness classification → boolean decomposition → deadline routing. Input the 6 ICH E2A seriousness criteria ",
      params: ["death", "hospitalization", "disability", "life_threatening", "congenital_anomaly", "medically_important"],
    },
    {
      name: "run-adr-severity-escalation",
      label: "Run Adr Severity Escalation",
      description: "ADR CTCAE grading → escalation routing. Classify adverse drug reaction severity using CTCAE-aligned criteria and get the",
      params: ["is_fatal"],
    },
    {
      name: "run-confidence-deadline",
      label: "Run Confidence Deadline",
      description: "Assessment confidence level → reporting urgency classification. Given an assessment confidence score and days until repo",
      params: ["confidence", "deadline_days"],
    },
    {
      name: "run-investigation-prioritization",
      label: "Run Investigation Prioritization",
      description: "Transbeyesian class propagation → EIG priority ranking. For a drug-event signal, determines whether to investigate direc",
      params: ["source_prr", "signal_threshold", "transfer_weight", "prior_strength", "uncertainty_level", "extremity_level", "propagation_count"],
    },
    {
      name: "run-signal-deep-validation",
      label: "Run Signal Deep Validation",
      description: "Multi-dimensional signal quality assessment. Combines 4 disproportionality measures (PRR/ROR/IC/EBGM), validates criteri",
      params: ["prr_signal", "ror_signal", "ic_signal", "ebgm_signal", "prr_above_threshold", "case_count_sufficient", "geographic_spread", "temporal_pattern", "prr_current", "pct_change", "occurrence_count", "prior_action_taken"],
    },
    {
      name: "run-bradford-hill-evidence",
      label: "Run Bradford Hill Evidence",
      description: "Bradford Hill evidence assessment: signal comparison → dose-response classification → Naranjo causality. A 3-criterion c",
      params: ["signal_a", "signal_b", "low_dose_rate", "mid_dose_rate", "high_dose_rate", "naranjo_score"],
    },
    {
      name: "run-bradford-hill-multi-criterion",
      label: "Run Bradford Hill Multi Criterion",
      description: "Full 5-criterion Bradford Hill causality assessment: temporal association → signal comparison → dose-response → rechalle",
      params: ["drug_start_to_event_days", "event_before_drug", "signal_a", "signal_b", "threshold", "low_dose_rate", "mid_dose_rate", "high_dose_rate", "baseline_rate", "first_exposure_rate", "rechallenge_rate", "naranjo_score"],
    },
    {
      name: "run-crystalbook-4primitive",
      label: "Run Crystalbook 4Primitive",
      description: "Crystalbook 4-Primitive Conservation Check: assess whether a system conserves Existence (∃), Boundary (∂), State (ς), an",
      params: [],
    },
    {
      name: "run-crystalbook-8law",
      label: "Run Crystalbook 8Law",
      description: "Crystalbook 8-Law Risk Matrix: assess virtue scores (0-10) for each of the 8 Laws of System Homeostasis. Scores 7+ = SAT",
      params: [],
    },
    {
      name: "run-crystalbook-diagnostic",
      label: "Run Crystalbook Diagnostic",
      description: "Crystalbook Full Diagnostic: combines 4-primitive conservation check + law triage into a single diagnostic. Returns cons",
      params: [],
    },
    {
      name: "run-ich-q1a-stability-testing",
      label: "Run Ich Q1A Stability Testing",
      description: "ICH Q1A(R2) Stability Testing decision tree. Given product type, storage type, and accelerated study outcome, returns st",
      params: ["product_type", "storage_type"],
    },
    {
      name: "run-ich-q1b-photostability",
      label: "Run Ich Q1B Photostability",
      description: "ICH Q1B Photostability Testing decision tree. Encodes the Decision Flow Chart: directly exposed → immediate pack → marke",
      params: ["product_type"],
    },
    {
      name: "run-ich-e1-population-exposure",
      label: "Run Ich E1 Population Exposure",
      description: "ICH E1 Population Exposure decision tree. Routes minimum safety database size for drugs intended for long-term treatment",
      params: ["treatment_duration", "condition_severity"],
    },
    {
      name: "run-heligram",
      label: "Run Heligram",
      description: "Helix Computing decision tree — encode any system through the conservation law ∃ = ∂(×(ς, ∅)). Given boundary sharpness ",
      params: ["boundary", "state", "void"],
    },
    {
      name: "run-sota-drift-detection",
      label: "Run Sota Drift Detection",
      description: "Guardian SOTA Tracker — detect frontier movement in a pharmacovigilance domain. Classifies the PV domain (signal detecti",
      params: ["domain", "evidence_level", "authority_weight", "novelty_score"],
    },
    {
      name: "run-sota-authority-decompose",
      label: "Run Sota Authority Decompose",
      description: "Decompose threshold authority into primitives — consensus breadth, credential strength, evidence basis, institutional ba",
      params: ["consensus_level", "credential_strength", "evidence_basis", "institutional_backing"],
    },
    {
      name: "run-sota-pubmed-pipeline",
      label: "Run Sota Pubmed Pipeline",
      description: "PubMed → SOTA pipeline: triage a publication for frontier relevance, classify its PV domain, check frontier movement, an",
      params: ["article_type", "pub_year", "domain", "novelty_score"],
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
