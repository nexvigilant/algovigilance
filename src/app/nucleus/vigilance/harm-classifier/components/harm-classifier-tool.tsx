"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  Info,
  Zap,
  Target,
  ArrowRight,
  Calculator,
} from "lucide-react";
import {
  HARM_TYPES,
  classifyHarm,
  computeSafetyMargin,
  getHierarchyName,
  type ClassificationResult,
  type SafetyMarginResult,
  type SafetyMarginInput,
} from "@/lib/harm-compute";
import { classifyHarmType, type HarmTypeResult } from "@/lib/pv-compute";
import { cn } from "@/lib/utils";

function HarmTypeCard({
  letter,
  name,
  description,
  examples,
  temporal,
  scope,
  mechanism,
  hierarchy_levels,
  conservation_law,
  conservation_description,
  isSelected,
}: {
  letter: string;
  name: string;
  description: string;
  examples: string[];
  temporal: string;
  scope: string;
  mechanism: string;
  hierarchy_levels: number[];
  conservation_law: number | null;
  conservation_description: string;
  isSelected: boolean;
}) {
  return (
    <Card
      className={cn(
        "bg-nex-surface border transition-all",
        isSelected
          ? "border-emerald-400/50 ring-1 ring-emerald-400/20"
          : "border-nex-light",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/30 font-mono text-lg px-3">
              {letter}
            </Badge>
            <CardTitle className="text-slate-light text-base">{name}</CardTitle>
          </div>
          {conservation_law !== null && (
            <Badge
              variant="outline"
              className="border-cyan/30 text-cyan text-xs"
            >
              CL-{conservation_law}
            </Badge>
          )}
        </div>
        <CardDescription className="text-slate-dim text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className="text-xs border-slate-500/30 text-slate-dim"
          >
            {temporal}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs border-slate-500/30 text-slate-dim"
          >
            {scope}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs border-slate-500/30 text-slate-dim"
          >
            {mechanism}
          </Badge>
        </div>
        <div className="text-xs text-slate-dim">
          <span className="font-medium">Levels: </span>
          {hierarchy_levels.map((l) => getHierarchyName(l)).join(" → ")}
        </div>
        <div className="text-xs text-slate-dim">
          <span className="font-medium">Conservation: </span>
          {conservation_description}
        </div>
        <div className="space-y-1">
          {examples.map((ex, i) => (
            <div
              key={i}
              className="text-xs text-slate-dim flex items-start gap-1.5"
            >
              <ArrowRight className="h-3 w-3 mt-0.5 text-emerald-400/60 shrink-0" />
              {ex}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ClassifierPanel() {
  const [temporal, setTemporal] = useState<"acute" | "cumulative" | null>(null);
  const [scope, setScope] = useState<"individual" | "population" | null>(null);
  const [mechanism, setMechanism] = useState<"direct" | "indirect" | null>(
    null,
  );
  const [result, setResult] = useState<ClassificationResult | null>(null);

  // pv-compute: route harm type to response protocol (SLA, escalation)
  const responseProtocol: HarmTypeResult | null = useMemo(
    () =>
      result ? classifyHarmType({ harm_type: result.harm_type.letter }) : null,
    [result],
  );

  const classify = useCallback(() => {
    if (!temporal || !scope || !mechanism) return;
    setResult(classifyHarm(temporal, scope, mechanism));
  }, [temporal, scope, mechanism]);

  const ToggleButton = ({
    selected,
    onClick,
    label,
  }: {
    selected: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
        selected
          ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30"
          : "bg-nex-dark text-slate-dim border border-nex-border hover:border-slate-500/50",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            Classify Adverse Event
          </CardTitle>
          <CardDescription className="text-slate-dim">
            Answer 3 binary questions to determine harm type (A-H)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm text-slate-light font-medium">
              1. Temporal Pattern
            </Label>
            <p className="text-xs text-slate-dim">
              When does the harm manifest?
            </p>
            <div className="flex gap-2">
              <ToggleButton
                selected={temporal === "acute"}
                onClick={() => setTemporal("acute")}
                label="Acute (immediate)"
              />
              <ToggleButton
                selected={temporal === "cumulative"}
                onClick={() => setTemporal("cumulative")}
                label="Cumulative (delayed)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-light font-medium">
              2. Scope
            </Label>
            <p className="text-xs text-slate-dim">Who is affected?</p>
            <div className="flex gap-2">
              <ToggleButton
                selected={scope === "individual"}
                onClick={() => setScope("individual")}
                label="Individual patient"
              />
              <ToggleButton
                selected={scope === "population"}
                onClick={() => setScope("population")}
                label="Population / subgroup"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-light font-medium">
              3. Mechanism
            </Label>
            <p className="text-xs text-slate-dim">How does the harm occur?</p>
            <div className="flex gap-2">
              <ToggleButton
                selected={mechanism === "direct"}
                onClick={() => setMechanism("direct")}
                label="Direct (on-target)"
              />
              <ToggleButton
                selected={mechanism === "indirect"}
                onClick={() => setMechanism("indirect")}
                label="Indirect (off-target)"
              />
            </div>
          </div>

          <Button
            onClick={classify}
            disabled={!temporal || !scope || !mechanism}
            className="w-full bg-emerald-500 text-nex-deep hover:bg-emerald-400 font-medium disabled:opacity-50"
          >
            <Zap className="h-4 w-4 mr-2" />
            Classify Harm Type
          </Button>

          <div className="p-3 rounded-lg bg-nex-light/20 space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-dim">
              <Info className="h-3 w-3" />
              Theory of Vigilance: 2³ = 8 harm types from 3 binary attributes
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light">
            Classification Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-slate-dim/50 mb-3" />
              <p className="text-sm text-slate-dim">
                Select all 3 attributes and classify
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/30 font-mono text-2xl px-4 py-2">
                  {result.harm_type.letter}
                </Badge>
                <div>
                  <p className="text-lg font-bold text-slate-light">
                    {result.harm_type.name}
                  </p>
                  <p className="text-sm text-slate-dim">
                    {result.harm_type.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {result.reasoning.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-dim"
                  >
                    <ArrowRight className="h-3.5 w-3.5 mt-0.5 text-cyan shrink-0" />
                    {r}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan/30 text-cyan">
                  Levels:{" "}
                  {result.harm_type.hierarchy_levels
                    .map((l) => getHierarchyName(l))
                    .join(", ")}
                </Badge>
                {result.safety_margin_applicable && (
                  <Badge
                    variant="outline"
                    className="border-emerald-400/30 text-emerald-400"
                  >
                    Safety margin: applicable
                  </Badge>
                )}
              </div>

              {/* pv-compute: Response protocol routing */}
              {responseProtocol && (
                <div
                  className={cn(
                    "p-3 rounded-lg border",
                    responseProtocol.escalate
                      ? "bg-red-500/5 border-red-500/20"
                      : "bg-emerald-400/5 border-emerald-400/20",
                  )}
                >
                  <p className="text-xs font-medium text-slate-dim mb-2">
                    Response Protocol
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={
                        responseProtocol.escalate
                          ? "border-red-500/30 text-red-400"
                          : "border-emerald-400/30 text-emerald-400"
                      }
                    >
                      {responseProtocol.protocol.replace(/_/g, " ")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-cyan/30 text-cyan"
                    >
                      SLA: {responseProtocol.sla_hours}h
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-500/30 text-slate-dim"
                    >
                      {responseProtocol.severity.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-[9px] text-slate-dim/40 mt-1 font-mono">
                    pv-compute · classifyHarmType
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-nex-light/30">
                <p className="text-xs font-medium text-slate-dim mb-1">
                  Examples
                </p>
                {result.harm_type.examples.map((ex, i) => (
                  <p key={i} className="text-xs text-slate-dim">
                    - {ex}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SafetyMarginPanel() {
  const [prr, setPrr] = useState("");
  const [rorLower, setRorLower] = useState("");
  const [ic025, setIc025] = useState("");
  const [eb05, setEb05] = useState("");
  const [n, setN] = useState("");
  const [result, setResult] = useState<SafetyMarginResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(() => {
    setError(null);
    const input: SafetyMarginInput = {
      prr: parseFloat(prr),
      ror_lower: parseFloat(rorLower),
      ic025: parseFloat(ic025),
      eb05: parseFloat(eb05),
      n: parseInt(n, 10),
    };
    if (Object.values(input).some(isNaN)) {
      setError("All fields are required");
      return;
    }
    setResult(computeSafetyMargin(input));
  }, [prr, rorLower, ic025, eb05, n]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            Safety Margin d(s)
          </CardTitle>
          <CardDescription className="text-slate-dim">
            Signed distance to harm boundary from signal metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              label: "PRR",
              value: prr,
              set: setPrr,
              placeholder: "2.5",
              hint: "Threshold: ≥ 2.0",
            },
            {
              label: "ROR Lower CI",
              value: rorLower,
              set: setRorLower,
              placeholder: "1.3",
              hint: "Threshold: > 1.0",
            },
            {
              label: "IC025",
              value: ic025,
              set: setIc025,
              placeholder: "0.5",
              hint: "Threshold: > 0",
            },
            {
              label: "EB05",
              value: eb05,
              set: setEb05,
              placeholder: "2.1",
              hint: "Threshold: ≥ 2.0",
            },
            {
              label: "Case Count (N)",
              value: n,
              set: setN,
              placeholder: "5",
              hint: "Threshold: ≥ 3",
            },
          ].map(({ label, value, set, placeholder, hint }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-sm text-slate-dim">{label}</Label>
                <span className="text-xs text-slate-dim/70">{hint}</span>
              </div>
              <Input
                type="number"
                step={0.01}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="bg-nex-dark border-nex-border text-cyan font-mono"
              />
            </div>
          ))}
          <Button
            onClick={compute}
            className="w-full bg-emerald-500 text-nex-deep hover:bg-emerald-400 font-medium"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Compute Safety Margin
          </Button>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-slate-light">Margin Result</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-slate-dim/50 mb-3" />
              <p className="text-sm text-slate-dim">
                Enter signal metrics to compute d(s)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={cn(
                  "p-4 rounded-lg border text-center",
                  result.safe
                    ? "bg-emerald-400/5 border-emerald-400/20"
                    : "bg-red-500/5 border-red-500/20",
                )}
              >
                <p className="text-xs text-slate-dim mb-1">
                  Safety Margin d(s)
                </p>
                <p
                  className={cn(
                    "text-3xl font-bold font-mono",
                    result.safe ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {result.d_s > 0 ? "+" : ""}
                  {result.d_s.toFixed(4)}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-2",
                    result.safe
                      ? "border-emerald-400/30 text-emerald-400"
                      : "border-red-500/30 text-red-400",
                  )}
                >
                  {result.safe ? "Within Safety Boundary" : "Signal Detected"}
                </Badge>
              </div>

              <p className="text-sm text-slate-dim">{result.interpretation}</p>

              <div className="space-y-2">
                {result.contributing_factors.map((f) => (
                  <div
                    key={f.metric}
                    className="flex items-center justify-between p-2 rounded bg-nex-light/20"
                  >
                    <span className="text-sm text-slate-dim">{f.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-cyan">
                        {f.value}
                      </span>
                      <span className="text-xs text-slate-dim">
                        / {f.threshold}
                      </span>
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          f.breached ? "bg-red-400" : "bg-emerald-400",
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function HarmClassifierTool() {
  const [activeTab, setActiveTab] = useState("taxonomy");

  return (
    <div className="min-h-screen p-6 space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-400/10">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-light">
              Harm Classifier
            </h1>
            <p className="text-slate-dim text-sm">
              Theory of Vigilance: 8-type harm taxonomy with safety margin
              analysis
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge
            variant="outline"
            className="border-emerald-400/30 text-emerald-400"
          >
            8 Harm Types (A-H)
          </Badge>
          <Badge variant="outline" className="border-cyan/30 text-cyan">
            Client-Side
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-500/30 text-slate-dim"
          >
            T1: Σ+κ+∂+→
          </Badge>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-nex-surface border border-nex-light">
          <TabsTrigger
            value="taxonomy"
            className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 gap-2"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Taxonomy</span>
          </TabsTrigger>
          <TabsTrigger
            value="classify"
            className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 gap-2"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Classify</span>
          </TabsTrigger>
          <TabsTrigger
            value="margin"
            className="data-[state=active]:bg-emerald-400/10 data-[state=active]:text-emerald-400 gap-2"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Safety Margin</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="taxonomy" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HARM_TYPES.map((ht) => (
              <HarmTypeCard key={ht.letter} {...ht} isSelected={false} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="classify" className="mt-4">
          <ClassifierPanel />
        </TabsContent>

        <TabsContent value="margin" className="mt-4">
          <SafetyMarginPanel />
        </TabsContent>
      </Tabs>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Harm taxonomy (A-H) classification via Theory of Vigilance. AI agents classify harm at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">Glass Signal Lab</a>
      </div>
    </div>
  );
}
