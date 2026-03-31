"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, FlaskConical, Info, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import { computeQbri, type BenefitRiskFactor, type QbriResult } from "@/lib/pv-compute";
import { Slider } from "@/components/ui/slider";
import { callStation } from "../station-client";

// ─── Factor Definitions ───────────────────────────────────────────────────────

interface FactorDef {
  key: string;
  label: string;
  plain: string;
  weight: number;
  defaultScore: number;
  hint: string;
  kind: "benefit" | "risk";
}

const BENEFIT_FACTORS: FactorDef[] = [
  {
    key: "effect_size",
    label: "Effect Size",
    plain: "How much does the drug improve the primary outcome?",
    weight: 0.35,
    defaultScore: 5,
    hint: "Use NNT or relative risk reduction. Score 10 = curative, 1 = minimal benefit.",
    kind: "benefit",
  },
  {
    key: "unmet_need",
    label: "Unmet Medical Need",
    plain: "How urgent is the patient's need for this treatment?",
    weight: 0.30,
    defaultScore: 6,
    hint: "Score 10 = life-threatening with no alternatives, 1 = cosmetic with many alternatives.",
    kind: "benefit",
  },
  {
    key: "duration",
    label: "Durability of Effect",
    plain: "How long does the benefit last?",
    weight: 0.20,
    defaultScore: 5,
    hint: "Score 10 = permanent cure, 1 = effects disappear immediately after stopping.",
    kind: "benefit",
  },
  {
    key: "quality_of_life",
    label: "Quality of Life Impact",
    plain: "How much does the drug improve daily functioning and wellbeing?",
    weight: 0.15,
    defaultScore: 5,
    hint: "Use validated QoL instruments (SF-36, EQ-5D). Score 10 = transforms life, 1 = negligible.",
    kind: "benefit",
  },
];

const RISK_FACTORS: FactorDef[] = [
  {
    key: "signal_strength",
    label: "Signal Strength",
    plain: "How strong is the disproportionality signal in spontaneous reports?",
    weight: 0.30,
    defaultScore: 4,
    hint: "Based on PRR/ROR. Score 10 = PRR > 10 with many cases, 1 = no signal detected.",
    kind: "risk",
  },
  {
    key: "severity",
    label: "Adverse Event Severity",
    plain: "How serious is the most important adverse reaction?",
    weight: 0.30,
    defaultScore: 5,
    hint: "CTCAE Grade 1-2 = low score, Grade 4-5 (fatal/life-threatening) = high score.",
    kind: "risk",
  },
  {
    key: "reversibility",
    label: "Reversibility",
    plain: "Can the harm be reversed if the drug is stopped?",
    weight: 0.20,
    defaultScore: 3,
    hint: "Score 10 = permanent irreversible harm (e.g., aplastic anemia), 1 = resolves within hours.",
    kind: "risk",
  },
  {
    key: "frequency",
    label: "Frequency of Adverse Events",
    plain: "How often does the adverse reaction occur?",
    weight: 0.20,
    defaultScore: 3,
    hint: "Score 10 = affects > 10% of patients, 1 = extremely rare (< 1 in 100,000).",
    kind: "risk",
  },
];

// ─── Preset scenarios ─────────────────────────────────────────────────────────

interface Preset {
  id: string;
  label: string;
  description: string;
  benefits: Record<string, number>;
  risks: Record<string, number>;
  expectedOutcome: QbriResult["category"];
}

const PRESETS: Preset[] = [
  {
    id: "favorable",
    label: "Curative Cancer Therapy",
    description: "High-efficacy oncology drug for a life-threatening indication with manageable toxicity.",
    benefits: { effect_size: 9, unmet_need: 10, duration: 8, quality_of_life: 7 },
    risks: { signal_strength: 5, severity: 7, reversibility: 4, frequency: 4 },
    expectedOutcome: "favorable",
  },
  {
    id: "marginal",
    label: "Moderate Chronic Disease Drug",
    description: "Moderate efficacy for a serious condition where alternatives exist, with notable safety concerns.",
    benefits: { effect_size: 5, unmet_need: 6, duration: 6, quality_of_life: 5 },
    risks: { signal_strength: 5, severity: 5, reversibility: 5, frequency: 5 },
    expectedOutcome: "marginal",
  },
  {
    id: "unfavorable",
    label: "High-Risk Low-Benefit Agent",
    description: "Weak clinical benefit in a non-serious condition, with serious and frequent adverse events.",
    benefits: { effect_size: 2, unmet_need: 2, duration: 3, quality_of_life: 2 },
    risks: { signal_strength: 8, severity: 9, reversibility: 7, frequency: 8 },
    expectedOutcome: "unfavorable",
  },
];

// ─── Decision zone config ─────────────────────────────────────────────────────

interface ZoneConfig {
  label: string;
  sublabel: string;
  description: string;
  color: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  badgeColor: string;
  min: number;
  max: number | null;
}

const ZONES: ZoneConfig[] = [
  {
    label: "Approve",
    sublabel: "Favorable",
    description:
      "Benefits outweigh risks by a clear margin. Supports approval or continued marketing without major restrictions.",
    color: "bg-emerald-500",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    badgeColor: "bg-emerald-500/20 text-emerald-300",
    min: 2.0,
    max: null,
  },
  {
    label: "Monitor",
    sublabel: "Marginal",
    description:
      "Benefits and risks are close. Risk management plan (RMP), REMS, or enhanced pharmacovigilance is warranted.",
    color: "bg-amber-500",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    badgeColor: "bg-amber-500/20 text-amber-300",
    min: 1.0,
    max: 2.0,
  },
  {
    label: "Restrict",
    sublabel: "Unfavorable",
    description:
      "Risks outweigh benefits. Withdrawal, label restriction to narrow indication, or black-box warning required.",
    color: "bg-red-500",
    textColor: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/5",
    badgeColor: "bg-red-500/20 text-red-300",
    min: 0,
    max: 1.0,
  },
];

function getZone(qbri: number): ZoneConfig {
  if (qbri >= 2.0) return ZONES[0];
  if (qbri >= 1.0) return ZONES[1];
  return ZONES[2];
}

// ─── Gauge ────────────────────────────────────────────────────────────────────

function QbriGauge({ qbri }: { qbri: number }) {
  // Map QBRI to a gauge percentage. 0→0%, 1.0→33%, 2.0→66%, 4+→100%
  const MAX_DISPLAY = 4.0;
  const clampedPct = Math.min(100, (Math.min(qbri, MAX_DISPLAY) / MAX_DISPLAY) * 100);
  const zone = getZone(qbri);

  // Three zone segments
  const restrictPct = (1.0 / MAX_DISPLAY) * 100; // 25%
  const marginalPct = (1.0 / MAX_DISPLAY) * 100; // 25%
  const approvePct = 50; // 50%

  const needlePct = clampedPct;

  return (
    <div className="space-y-3">
      {/* QBRI value */}
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
          QBRI Score
        </p>
        <p className={cn("text-5xl font-extrabold font-mono tabular-nums", zone.textColor)}>
          {isFinite(qbri) ? qbri.toFixed(2) : "Inf"}
        </p>
        <p className={cn("text-sm font-semibold mt-1", zone.textColor)}>
          {zone.label} — {zone.sublabel}
        </p>
      </div>

      {/* Bar gauge */}
      <div className="space-y-1">
        <div className="relative h-6 rounded-full overflow-hidden flex">
          <div
            className="bg-red-500/40 flex items-center justify-center"
            style={{ width: `${restrictPct}%` }}
          >
            <span className="text-[8px] font-mono text-red-300/70 uppercase tracking-wider">
              Restrict
            </span>
          </div>
          <div
            className="bg-amber-500/40 flex items-center justify-center"
            style={{ width: `${marginalPct}%` }}
          >
            <span className="text-[8px] font-mono text-amber-300/70 uppercase tracking-wider">
              Monitor
            </span>
          </div>
          <div
            className="bg-emerald-500/40 flex-1 flex items-center justify-center"
            style={{ width: `${approvePct}%` }}
          >
            <span className="text-[8px] font-mono text-emerald-300/70 uppercase tracking-wider">
              Approve
            </span>
          </div>
          {/* Needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg transition-all duration-500"
            style={{ left: `${needlePct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-white/20">
          <span>0</span>
          <span>1.0</span>
          <span>2.0</span>
          <span>4.0+</span>
        </div>
      </div>
    </div>
  );
}

// ─── Slider card ─────────────────────────────────────────────────────────────

function FactorSlider({
  factor,
  score,
  onChange,
  kind,
}: {
  factor: FactorDef;
  score: number;
  onChange: (v: number) => void;
  kind: "benefit" | "risk";
}) {
  const [showHint, setShowHint] = useState(false);
  const contribution = factor.weight * score;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/80">{factor.label}</span>
            <span
              className={cn(
                "text-[9px] font-mono px-1.5 py-0.5 rounded",
                kind === "benefit"
                  ? "bg-emerald-500/15 text-emerald-400/70"
                  : "bg-red-500/15 text-red-400/70",
              )}
            >
              w={factor.weight.toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-white/40 mt-0.5">{factor.plain}</p>
        </div>
        <div className="text-right shrink-0">
          <span
            className={cn(
              "text-lg font-bold font-mono tabular-nums",
              kind === "benefit" ? "text-emerald-400" : "text-red-400",
            )}
          >
            {score}
          </span>
          <p className="text-[9px] font-mono text-white/20">
            →{" "}
            <span
              className={cn(
                kind === "benefit" ? "text-emerald-400/60" : "text-red-400/60",
              )}
            >
              {contribution.toFixed(2)}
            </span>
          </p>
        </div>
      </div>

      <Slider
        min={1}
        max={10}
        step={1}
        value={[score]}
        onValueChange={([v]) => onChange(v)}
        className={cn(
          "mb-2",
          kind === "benefit" ? "[&>[role=slider]]:bg-emerald-500" : "[&>[role=slider]]:bg-red-500",
        )}
        aria-label={factor.label}
      />

      <div className="flex justify-between items-center">
        <div className="flex gap-3 text-[9px] font-mono text-white/15">
          <span>1 = minimal</span>
          <span>10 = maximum</span>
        </div>
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-[9px] font-mono text-white/20 hover:text-white/50 transition-colors"
        >
          {showHint ? (
            <ChevronUp className="h-3 w-3 inline" />
          ) : (
            <ChevronDown className="h-3 w-3 inline" />
          )}{" "}
          hint
        </button>
      </div>

      {showHint && (
        <p className="mt-1.5 text-[10px] text-amber-300/60 bg-amber-500/5 border border-amber-500/15 rounded px-2 py-1 leading-relaxed">
          {factor.hint}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

type Scores = Record<string, number>;

function buildFactors(defs: FactorDef[], scores: Scores): BenefitRiskFactor[] {
  return defs.map((d) => ({
    name: d.label,
    weight: d.weight,
    score: scores[d.key] ?? d.defaultScore,
  }));
}

export default function BenefitRiskLab() {
  const [benefitScores, setBenefitScores] = useState<Scores>(
    Object.fromEntries(BENEFIT_FACTORS.map((f) => [f.key, f.defaultScore])),
  );
  const [riskScores, setRiskScores] = useState<Scores>(
    Object.fromEntries(RISK_FACTORS.map((f) => [f.key, f.defaultScore])),
  );
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [stationQbri, setStationQbri] = useState<{
    qbri: number;
    verdict: string;
  } | null>(null);
  const [stationLoading, setStationLoading] = useState(false);

  const verifyWithStation = useCallback(async () => {
    setStationLoading(true);
    try {
      const benefits = buildFactors(BENEFIT_FACTORS, benefitScores);
      const risks = buildFactors(RISK_FACTORS, riskScores);
      const live = await callStation(
        "benefit-risk_nexvigilant_com_compute_qbr_simple",
        {
          benefit_score: benefits.reduce((s, f) => s + f.score * f.weight, 0),
          risk_score: risks.reduce((s, f) => s + f.score * f.weight, 0),
        },
      );
      if (live) {
        setStationQbri({
          qbri: Number(live.qbr ?? live.qbri ?? live.ratio ?? 0),
          verdict: String(live.verdict ?? live.interpretation ?? "Unknown"),
        });
      }
    } finally {
      setStationLoading(false);
    }
  }, [benefitScores, riskScores]);

  const result: QbriResult = useMemo(() => {
    const benefits = buildFactors(BENEFIT_FACTORS, benefitScores);
    const risks = buildFactors(RISK_FACTORS, riskScores);
    return computeQbri(benefits, risks);
  }, [benefitScores, riskScores]);

  const zone = getZone(result.qbri);

  const handlePreset = useCallback((preset: Preset) => {
    setBenefitScores({ ...preset.benefits });
    setRiskScores({ ...preset.risks });
    setActivePreset(preset.id);
  }, []);

  const handleReset = useCallback(() => {
    setBenefitScores(
      Object.fromEntries(BENEFIT_FACTORS.map((f) => [f.key, f.defaultScore])),
    );
    setRiskScores(
      Object.fromEntries(RISK_FACTORS.map((f) => [f.key, f.defaultScore])),
    );
    setActivePreset(null);
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-golden-4">
      {/* Header */}
      <header className="mb-golden-3 text-center pt-golden-3">
        <div className="flex items-center justify-center gap-2 mb-golden-1">
          <FlaskConical className="h-5 w-5 text-cyan-400" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Academy Lab
          </p>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
          Benefit-Risk Calculator
        </h1>
        <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
          Compute the{" "}
          <JargonBuster
            term="QBRI"
            definition="Quantitative Benefit-Risk Index — a weighted ratio of benefit scores to risk scores, per CIOMS Working Group IV methodology. QBRI > 2.0 = favorable, 1.0–2.0 = marginal, < 1.0 = unfavorable."
          >
            Quantitative Benefit-Risk Index (QBRI)
          </JargonBuster>{" "}
          by adjusting sliders for four benefit and four risk factors. Decision
          zones update in real time.
        </p>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
          <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-cyan-300/80 leading-relaxed">
            QBRI = Σ(benefit_weight × score) / Σ(risk_weight × score).
            Weights are pre-set per CIOMS IV methodology. Each factor scored
            1–10. Formula runs entirely in your browser.
          </p>
        </div>

        {/* Preset scenarios */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
            Example Scenarios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePreset(p)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  activePreset === p.id
                    ? "border-cyan-500/40 bg-cyan-500/10"
                    : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold mb-1",
                    p.expectedOutcome === "favorable"
                      ? "text-emerald-400"
                      : p.expectedOutcome === "marginal"
                        ? "text-amber-400"
                        : "text-red-400",
                  )}
                >
                  {p.label}
                </p>
                <p className="text-[10px] text-white/30 leading-relaxed">
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Live gauge — sticky */}
        <div className="rounded-lg border border-white/10 bg-zinc-950 p-5 sticky top-0 z-10 shadow-lg">
          <QbriGauge qbri={result.qbri} />
          {/* Benefit / Risk totals */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
            <div className="text-center">
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                Benefit Total
              </p>
              <p className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                {result.benefitTotal.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                Risk Total
              </p>
              <p className="text-lg font-bold font-mono text-red-400 tabular-nums">
                {result.riskTotal.toFixed(2)}
              </p>
            </div>
            <div
              className={cn(
                "text-center rounded-lg border p-2",
                zone.borderColor,
                zone.bgColor,
              )}
            >
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/30">
                Decision
              </p>
              <p className={cn("text-sm font-bold", zone.textColor)}>
                {zone.label}
              </p>
            </div>
          </div>
        </div>

        {/* Factor controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Benefit factors */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-emerald-400/60 flex items-center gap-2">
              <div className="h-px flex-1 bg-emerald-500/20" />
              Benefit Factors
              <div className="h-px flex-1 bg-emerald-500/20" />
            </h2>
            {BENEFIT_FACTORS.map((f) => (
              <FactorSlider
                key={f.key}
                factor={f}
                score={benefitScores[f.key] ?? f.defaultScore}
                onChange={(v) =>
                  setBenefitScores((prev) => ({ ...prev, [f.key]: v }))
                }
                kind="benefit"
              />
            ))}
          </div>

          {/* Risk factors */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-red-400/60 flex items-center gap-2">
              <div className="h-px flex-1 bg-red-500/20" />
              Risk Factors
              <div className="h-px flex-1 bg-red-500/20" />
            </h2>
            {RISK_FACTORS.map((f) => (
              <FactorSlider
                key={f.key}
                factor={f}
                score={riskScores[f.key] ?? f.defaultScore}
                onChange={(v) =>
                  setRiskScores((prev) => ({ ...prev, [f.key]: v }))
                }
                kind="risk"
              />
            ))}
          </div>
        </div>

        {/* Decision rationale */}
        <div
          className={cn(
            "rounded-lg border p-4",
            zone.borderColor,
            zone.bgColor,
          )}
        >
          <h3
            className={cn(
              "text-xs font-mono uppercase tracking-wider mb-2",
              zone.textColor,
            )}
          >
            Regulatory Interpretation — {zone.label}
          </h3>
          <p className="text-xs text-white/50 leading-relaxed">
            {zone.description}
          </p>
          <p className="text-xs text-white/30 mt-2 leading-relaxed">
            {result.qbri >= 2.0
              ? "Under ICH E8 / EMA CHMP benefit-risk framework, a QBRI > 2.0 with robust clinical evidence and reasonable safety data would typically support a positive opinion. Document remaining risks in the Risk Management Plan."
              : result.qbri >= 1.0
                ? "A QBRI of 1.0–2.0 falls in the zone where regulators require additional risk minimization. Typical measures: REMS (FDA), Risk Minimisation Measures (EMA), black-box warning, or restricted distribution."
                : "A QBRI < 1.0 means risk outweighs benefit under this model. Regulatory action options: withdrawal, label restriction to a narrow indication, suspension pending benefit-risk re-evaluation, or mandatory additional clinical data."}
          </p>
        </div>

        {/* Zone thresholds reference */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
            Decision Zone Thresholds
          </h3>
          <div className="space-y-2">
            {ZONES.map((z) => (
              <div
                key={z.label}
                className={cn(
                  "flex items-center justify-between rounded border p-2.5 transition-all",
                  result.qbri >= z.min &&
                    (z.max === null || result.qbri < z.max)
                    ? cn(z.borderColor, z.bgColor)
                    : "border-white/5 bg-white/[0.01]",
                )}
              >
                <div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      result.qbri >= z.min &&
                        (z.max === null || result.qbri < z.max)
                        ? z.textColor
                        : "text-white/30",
                    )}
                  >
                    {z.label}
                  </span>
                  <p className="text-[10px] text-white/30">{z.sublabel}</p>
                </div>
                <span className="text-[10px] font-mono text-white/30">
                  {z.max === null
                    ? `QBRI >= ${z.min.toFixed(1)}`
                    : `${z.min.toFixed(1)} <= QBRI < ${z.max.toFixed(1)}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Station verification — Academy→Glass bridge */}
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2">
            Verify with AlgoVigilance Station
          </h3>
          {!stationQbri ? (
            <button
              onClick={verifyWithStation}
              disabled={stationLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
            >
              {stationLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  Computing on mcp.nexvigilant.com...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Cross-check QBRI with Live Engine
                </>
              )}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Station QBRI</span>
                <span className="font-mono text-violet-300">
                  {stationQbri.qbri.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Station Verdict</span>
                <span className="font-mono text-violet-300">
                  {stationQbri.verdict}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Your QBRI</span>
                <span className="font-mono text-white">
                  {result.qbri.toFixed(3)}
                </span>
              </div>
              <p className="text-[10px] text-white/30 mt-1">
                Powered by mcp.nexvigilant.com — the same engine AI agents use.
              </p>
            </div>
          )}
        </div>

        {/* Academy → Glass Bridge */}
        <Link
          href="/nucleus/glass/benefit-risk-lab"
          className="block w-full rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-violet-500/10 p-4 hover:from-amber-500/15 hover:to-violet-500/15 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-amber-400/70 mb-1">
                Ready for real drugs?
              </p>
              <p className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                Try it live in Glass
              </p>
              <p className="text-xs text-white/40 mt-1">
                Run benefit-risk analysis on any drug with live data from mcp.nexvigilant.com
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Link>

        {/* Reset */}
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
