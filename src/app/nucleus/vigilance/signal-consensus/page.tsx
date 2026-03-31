"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  TrafficLight,
  TipBox,
  JargonBuster,
  TechnicalStuffBox,
} from "@/components/pv-for-nexvigilants";
import {
  computeSignals,
  type ContingencyTable,
  type SignalResult,
} from "@/lib/pv-compute/signal-detection";
import { Activity, FlaskConical, ShieldCheck, Download, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Consensus classification — mirrors disproportionality-consensus microgram
// ---------------------------------------------------------------------------

type ConsensusLevel = "STRONG" | "MODERATE" | "WEAK" | "MARGINAL" | "NONE" | "INSUFFICIENT";

interface ConsensusResult {
  level: ConsensusLevel;
  count: number;
  methods: string[];
  action: string;
}

function classifyConsensus(r: SignalResult, nCases: number): ConsensusResult {
  if (nCases < 3) {
    return { level: "INSUFFICIENT", count: 0, methods: [], action: "Need more cases" };
  }

  const methods: string[] = [];
  if (r.prr_signal) methods.push("PRR");
  if (r.ror_signal) methods.push("ROR");
  if (r.ic_signal) methods.push("IC");
  if (r.ebgm_signal) methods.push("EBGM");

  const count = methods.length;
  if (count === 4) return { level: "STRONG", count, methods, action: "Expedited review" };
  if (count === 3) return { level: "MODERATE", count, methods, action: "Standard review" };
  if (count === 2) return { level: "WEAK", count, methods, action: "Monitor" };
  if (count === 1) return { level: "MARGINAL", count, methods, action: "Investigate" };
  return { level: "NONE", count: 0, methods: [], action: "No action needed" };
}

const consensusBadge: Record<ConsensusLevel, { variant: "destructive" | "default" | "secondary" | "outline"; label: string }> = {
  STRONG: { variant: "destructive", label: "Strong Signal (4/4)" },
  MODERATE: { variant: "destructive", label: "Moderate Signal (3/4)" },
  WEAK: { variant: "default", label: "Weak Signal (2/4)" },
  MARGINAL: { variant: "secondary", label: "Marginal (1/4)" },
  NONE: { variant: "outline", label: "No Signal (0/4)" },
  INSUFFICIENT: { variant: "outline", label: "Insufficient Data" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SignalConsensusPage() {
  const searchParams = useSearchParams();
  const [drugName, setDrugName] = useState("");
  const [eventName, setEventName] = useState("");
  const [table, setTable] = useState<ContingencyTable>({ a: 0, b: 0, c: 0, d: 0 });
  const [result, setResult] = useState<SignalResult | null>(null);
  const [consensus, setConsensus] = useState<ConsensusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [faersError, setFaersError] = useState("");

  // Hydrate from URL query params for deep-linking
  // e.g. ?a=11511&b=66773&c=741962&d=19186743&drug=semaglutide&event=nausea
  useEffect(() => {
    const a = parseInt(searchParams.get("a") ?? "0");
    const b = parseInt(searchParams.get("b") ?? "0");
    const c = parseInt(searchParams.get("c") ?? "0");
    const d = parseInt(searchParams.get("d") ?? "0");
    const drug = searchParams.get("drug") ?? "";
    const event = searchParams.get("event") ?? "";

    if (a > 0) {
      const t = { a, b, c, d };
      setTable(t);
      setDrugName(drug);
      setEventName(event);
      const sig = computeSignals(t);
      setResult(sig);
      setConsensus(classifyConsensus(sig, a));
    }
  }, [searchParams]);

  function handleCompute() {
    if (table.a <= 0) return;
    const sig = computeSignals(table);
    setResult(sig);
    setConsensus(classifyConsensus(sig, table.a));
  }

  function handleClear() {
    setTable({ a: 0, b: 0, c: 0, d: 0 });
    setResult(null);
    setConsensus(null);
    setDrugName("");
    setEventName("");
  }

  async function handleLoadFromFAERS() {
    if (!drugName.trim() || !eventName.trim()) {
      setFaersError("Enter both drug name and adverse event first.");
      return;
    }
    setLoading(true);
    setFaersError("");
    try {
      const resp = await fetch("https://mcp.nexvigilant.com/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "open_vigil_fr_compute_disproportionality",
            arguments: {
              drug: drugName.trim(),
              event: eventName.trim().toUpperCase(),
            },
          },
        }),
      });
      const rpc = await resp.json();
      const text = rpc?.result?.content?.[0]?.text;
      if (!text) throw new Error("Empty response from Station");
      const data = JSON.parse(text);
      if (data.status === "error") throw new Error(data.message ?? "FAERS query failed");
      const ct = data.contingency_table;
      if (!ct) throw new Error("No contingency table in response");
      const t: ContingencyTable = {
        a: ct.a_drug_event,
        b: ct.b_drug_noevent,
        c: ct.c_nodrug_event,
        d: ct.d_nodrug_noevent,
      };
      setTable(t);
      const sig = computeSignals(t);
      setResult(sig);
      setConsensus(classifyConsensus(sig, t.a));
    } catch (err) {
      setFaersError(err instanceof Error ? err.message : "Failed to load FAERS data");
    } finally {
      setLoading(false);
    }
  }

  function signalLevel(signal: boolean): "green" | "red" {
    return signal ? "red" : "green";
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Signal Consensus Checker
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Check if a drug-event combination triggers a safety signal using four
          standard statistical methods. All four must agree for a strong signal.
        </p>
      </div>

      <TipBox className="mb-6">
        A safety signal means a drug might be causing a side effect more often
        than expected. We check this four different ways. The more methods that
        agree, the more confident we are.
      </TipBox>

      {/* Input Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Step 1: Enter Your Data
          </CardTitle>
          <CardDescription>
            Enter the 2×2 contingency table from FAERS or your safety database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drug + Event labels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="drug-name">Drug name (optional)</Label>
              <Input
                id="drug-name"
                placeholder="e.g. semaglutide"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="event-name">Adverse event (optional)</Label>
              <Input
                id="event-name"
                placeholder="e.g. nausea"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
          </div>

          {/* Load from FAERS */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleLoadFromFAERS}
              disabled={loading || !drugName.trim() || !eventName.trim()}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {loading ? "Querying FAERS..." : "Load from FAERS"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Auto-fills the table from FDA adverse event reports
            </span>
          </div>
          {faersError && (
            <p className="text-sm text-red-400">{faersError}</p>
          )}

          {/* 2x2 table */}
          <div>
            <JargonBuster
              term="Contingency Table"
              definition="A simple 2×2 grid counting how many reports mention the drug + event vs other drugs and other events."
            >
              Contingency Table
            </JargonBuster>
            <div className="mt-3 grid grid-cols-3 gap-2 max-w-md">
              {/* Header row */}
              <div />
              <div className="text-center text-xs font-medium text-muted-foreground">
                With Event
              </div>
              <div className="text-center text-xs font-medium text-muted-foreground">
                Without Event
              </div>

              {/* Drug row */}
              <div className="text-xs font-medium text-muted-foreground flex items-center">
                Target Drug
              </div>
              <div>
                <Input
                  type="number"
                  min={0}
                  placeholder="a"
                  value={table.a || ""}
                  onChange={(e) =>
                    setTable({ ...table, a: parseInt(e.target.value) || 0 })
                  }
                  aria-label="Reports of target drug with target event"
                />
              </div>
              <div>
                <Input
                  type="number"
                  min={0}
                  placeholder="b"
                  value={table.b || ""}
                  onChange={(e) =>
                    setTable({ ...table, b: parseInt(e.target.value) || 0 })
                  }
                  aria-label="Reports of target drug without target event"
                />
              </div>

              {/* Other drugs row */}
              <div className="text-xs font-medium text-muted-foreground flex items-center">
                Other Drugs
              </div>
              <div>
                <Input
                  type="number"
                  min={0}
                  placeholder="c"
                  value={table.c || ""}
                  onChange={(e) =>
                    setTable({ ...table, c: parseInt(e.target.value) || 0 })
                  }
                  aria-label="Reports of other drugs with target event"
                />
              </div>
              <div>
                <Input
                  type="number"
                  min={0}
                  placeholder="d"
                  value={table.d || ""}
                  onChange={(e) =>
                    setTable({ ...table, d: parseInt(e.target.value) || 0 })
                  }
                  aria-label="Reports of other drugs without target event"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleCompute} disabled={table.a <= 0}>
              Check for Signal
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && consensus && (
        <>
          {/* Consensus Banner */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Step 2: Consensus Verdict
                {drugName && eventName && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {drugName} + {eventName}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Badge
                  variant={consensusBadge[consensus.level].variant}
                  className="text-base px-4 py-1"
                >
                  {consensusBadge[consensus.level].label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {consensus.action}
                </span>
              </div>

              {consensus.methods.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Methods triggered:{" "}
                  <span className="font-medium text-foreground">
                    {consensus.methods.join(" + ")}
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Traffic Lights */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 3: Method-by-Method Results</CardTitle>
              <CardDescription>
                Each method checks the same question a different way. Red means that
                method detected a signal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TrafficLight
                level={signalLevel(result.prr_signal)}
                label={`PRR = ${result.prr.toFixed(2)} ${result.prr_signal ? "(≥ 2.0)" : "(< 2.0)"}`}
              />
              <TrafficLight
                level={signalLevel(result.ror_signal)}
                label={`ROR = ${result.ror.toFixed(2)} (95% CI: ${result.ror_lower.toFixed(2)}–${result.ror_upper.toFixed(2)}) ${result.ror_signal ? "lower CI > 1" : "lower CI ≤ 1"}`}
              />
              <TrafficLight
                level={signalLevel(result.ic_signal)}
                label={`IC = ${result.ic.toFixed(2)} (IC025 = ${result.ic025.toFixed(2)}) ${result.ic_signal ? "> 0" : "≤ 0"}`}
              />
              <TrafficLight
                level={signalLevel(result.ebgm_signal)}
                label={`EBGM = ${result.ebgm.toFixed(2)} (EB05 = ${result.eb05.toFixed(2)}) ${result.ebgm_signal ? "> 2" : "≤ 2"}`}
              />
            </CardContent>
          </Card>

          {/* Technical Detail */}
          <TechnicalStuffBox className="mb-6">
            <div className="space-y-1 text-xs font-mono">
              <p>Contingency: a={table.a} b={table.b} c={table.c} d={table.d} N={table.a + table.b + table.c + table.d}</p>
              <p>PRR = {result.prr.toFixed(4)} | χ² = {result.chi_square.toFixed(2)}</p>
              <p>ROR = {result.ror.toFixed(4)} [{result.ror_lower.toFixed(4)}, {result.ror_upper.toFixed(4)}]</p>
              <p>IC = {result.ic.toFixed(4)} | IC025 = {result.ic025.toFixed(4)}</p>
              <p>EBGM = {result.ebgm.toFixed(4)} | EB05 = {result.eb05.toFixed(4)}</p>
              <p className="pt-1">References: Evans (2001), DuMouchel (1999), Norén (2006)</p>
            </div>
          </TechnicalStuffBox>
        </>
      )}
    </div>
  );
}
