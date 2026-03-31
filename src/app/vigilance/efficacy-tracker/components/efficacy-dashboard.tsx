"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SignalRow {
  drug: string
  event: string
  harmType: string
  prr: number
  deltaPrr: number | null
  avMagnitude: number
  outcome: "ANNIHILATED" | "RESIDUAL" | "SURPLUS" | "baseline"
  pathway: string
}

// Static fallback data — replaced by live API data when available
const STATIC_SIGNALS: SignalRow[] = [
  { drug: "semaglutide", event: "NAUSEA", harmType: "A", prr: 3.81, deltaPrr: null, avMagnitude: 0.82, outcome: "ANNIHILATED", pathway: "GLP-1R → delayed gastric emptying" },
  { drug: "semaglutide", event: "VOMITING", harmType: "A", prr: 5.58, deltaPrr: null, avMagnitude: 0.57, outcome: "RESIDUAL", pathway: "GLP-1R → CTZ stimulation" },
  { drug: "semaglutide", event: "DIARRHOEA", harmType: "A", prr: 2.92, deltaPrr: null, avMagnitude: 0.41, outcome: "RESIDUAL", pathway: "GLP-1R → altered intestinal motility" },
  { drug: "semaglutide", event: "PANCREATITIS", harmType: "A", prr: 0, deltaPrr: null, avMagnitude: 0, outcome: "baseline", pathway: "GLP-1R → acinar hyperstimulation" },
  { drug: "semaglutide", event: "CHOLELITHIASIS", harmType: "B", prr: 0, deltaPrr: null, avMagnitude: 0, outcome: "baseline", pathway: "Rapid weight loss → gallbladder stasis" },
  { drug: "tirzepatide", event: "NAUSEA", harmType: "A", prr: 0, deltaPrr: null, avMagnitude: 0, outcome: "baseline", pathway: "GIP/GLP-1R → delayed gastric emptying" },
  { drug: "tirzepatide", event: "VOMITING", harmType: "A", prr: 0, deltaPrr: null, avMagnitude: 0, outcome: "baseline", pathway: "GIP/GLP-1R → CTZ stimulation" },
  { drug: "tirzepatide", event: "PANCREATITIS", harmType: "A", prr: 0, deltaPrr: null, avMagnitude: 0, outcome: "baseline", pathway: "GIP/GLP-1R → acinar hyperstimulation" },
  { drug: "metformin", event: "LACTIC ACIDOSIS", harmType: "A", prr: 0, deltaPrr: null, avMagnitude: 0, outcome: "baseline", pathway: "Complex I inhibition → lactate accumulation" },
  { drug: "metformin", event: "DIARRHOEA", harmType: "A", prr: 0, deltaPrr: null, avMagnitude: 0, outcome: "baseline", pathway: "GI mucosal irritation" },
  { drug: "metformin", event: "NAUSEA", harmType: "A", prr: 0, deltaPrr: null, avMagnitude: 0, outcome: "baseline", pathway: "GI mucosal irritation" },
]

interface ApiSignal {
  drug: string
  event: string
  prr: number | null
  ror: number | null
  case_count: number | null
  anti_vector_magnitude: number | null
  annihilation_outcome: string | null
  delta_prr: number | null
}

interface ApiResponse {
  signals: ApiSignal[]
  totalMeasurements: number
  generatedAt: string
}

function apiToSignalRow(api: ApiSignal): SignalRow {
  const outcome = api.annihilation_outcome?.includes("ANNIHILATED")
    ? "ANNIHILATED" as const
    : api.annihilation_outcome?.includes("RESIDUAL")
      ? "RESIDUAL" as const
      : api.annihilation_outcome?.includes("SURPLUS")
        ? "SURPLUS" as const
        : "baseline" as const
  return {
    drug: api.drug,
    event: api.event,
    harmType: "A",
    prr: api.prr ?? 0,
    deltaPrr: api.delta_prr,
    avMagnitude: api.anti_vector_magnitude ?? 0,
    outcome,
    pathway: "",
  }
}

const OUTCOME_STYLES: Record<string, string> = {
  ANNIHILATED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  RESIDUAL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SURPLUS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  baseline: "bg-muted text-muted-foreground",
}

const DRUG_COLORS: Record<string, string> = {
  semaglutide: "text-violet-400",
  tirzepatide: "text-cyan-400",
  metformin: "text-orange-400",
}

export function EfficacyDashboard() {
  const [drugFilter, setDrugFilter] = useState<string | null>(null)
  const [signals, setSignals] = useState<SignalRow[]>(STATIC_SIGNALS)
  const [totalMeasurements, setTotalMeasurements] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    fetch("/api/efficacy")
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        if (data.signals && data.signals.length > 0) {
          setSignals(data.signals.map(apiToSignalRow))
          setTotalMeasurements(data.totalMeasurements)
          setLastUpdated(data.generatedAt)
          setIsLive(true)
        }
      })
      .catch(() => {
        // Fallback to static data — API may not be available in dev
      })
  }, [])

  const drugs = [...new Set(signals.map((s) => s.drug))]

  const filtered = drugFilter
    ? signals.filter((s) => s.drug === drugFilter)
    : signals

  return (
    <div className="space-y-6">
      {/* Drug filter */}
      <div className="flex gap-2">
        <Badge
          variant={drugFilter === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setDrugFilter(null)}
        >
          All
        </Badge>
        {drugs.map((drug) => (
          <Badge
            key={drug}
            variant={drugFilter === drug ? "default" : "outline"}
            className={`cursor-pointer ${DRUG_COLORS[drug] || ""}`}
            onClick={() => setDrugFilter(drugFilter === drug ? null : drug)}
          >
            {drug}
          </Badge>
        ))}
      </div>

      {/* Signal table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signal Tracking</CardTitle>
          <CardDescription>
            PRR values updated nightly from FAERS via autonomous cron agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Drug</th>
                  <th className="pb-2 pr-4">Event</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4 text-right">PRR</th>
                  <th className="pb-2 pr-4 text-right">Δ PRR</th>
                  <th className="pb-2 pr-4 text-right">AV Mag</th>
                  <th className="pb-2 pr-4">Outcome</th>
                  <th className="pb-2">Pathway</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((signal, i) => (
                  <tr key={`${signal.drug}-${signal.event}`} className="border-b border-border/50">
                    <td className={`py-2 pr-4 font-medium ${DRUG_COLORS[signal.drug] || ""}`}>
                      {signal.drug}
                    </td>
                    <td className="py-2 pr-4">{signal.event}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className="text-xs">{signal.harmType}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {signal.prr > 0 ? signal.prr.toFixed(2) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {signal.deltaPrr !== null ? (
                        <span className={signal.deltaPrr > 0 ? "text-red-400" : signal.deltaPrr < 0 ? "text-emerald-400" : ""}>
                          {signal.deltaPrr > 0 ? "+" : ""}{signal.deltaPrr.toFixed(2)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">
                      {signal.avMagnitude > 0 ? signal.avMagnitude.toFixed(2) : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className={`text-xs ${OUTCOME_STYLES[signal.outcome] || ""}`}>
                        {signal.outcome}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">{signal.pathway}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback Loop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span className="rounded bg-primary/10 px-2 py-1 text-primary">FAERS Query</span>
            <span>→</span>
            <span className="rounded bg-primary/10 px-2 py-1 text-primary">Disproportionality</span>
            <span>→</span>
            <span className="rounded bg-primary/10 px-2 py-1 text-primary">Anti-Vector Compute</span>
            <span>→</span>
            <span className="rounded bg-primary/10 px-2 py-1 text-primary">Label Check</span>
            <span>→</span>
            <span className="rounded bg-primary/10 px-2 py-1 text-primary">Δ PRR Compare</span>
            <span>→</span>
            <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-400">Brain Artifact</span>
            <span>→</span>
            <span className="text-muted-foreground italic">↺ next night</span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Two autonomous cron agents run nightly: efficacy tracker (22:07) queries FAERS and computes anti-vectors,
            label drift monitor (22:37) hashes DailyMed sections and detects labeling changes. Both persist to brain.db
            and correlate signal movement with label evolution.
          </p>
        </CardContent>
      </Card>

      {/* Label drift status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Label Drift Monitor</CardTitle>
          <CardDescription>
            DailyMed label section hashes compared nightly — detects when labeling changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4">Drug</th>
                  <th className="pb-2 pr-4">ADR Section</th>
                  <th className="pb-2 pr-4">Warnings</th>
                  <th className="pb-2 pr-4">Boxed Warning</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {drugs.map((drug) => (
                  <tr key={drug} className="border-b border-border/50">
                    <td className={`py-2 pr-4 font-medium ${DRUG_COLORS[drug] || ""}`}>{drug}</td>
                    <td className="py-2 pr-4"><Badge variant="outline" className="text-xs">baseline</Badge></td>
                    <td className="py-2 pr-4"><Badge variant="outline" className="text-xs">baseline</Badge></td>
                    <td className="py-2 pr-4"><Badge variant="outline" className="text-xs">baseline</Badge></td>
                    <td className="py-2"><Badge variant="outline" className="text-xs bg-muted">monitoring</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
