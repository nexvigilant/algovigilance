"use client";

import { useState, useCallback, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import {
  TipBox,
  StepWizard,
  JargonBuster,
  TrafficLight,
  TechnicalStuffBox,
} from "@/components/pv-for-nexvigilants";
import type { Step, TrafficLevel } from "@/components/pv-for-nexvigilants";
import { computeQbri, type QbriResult } from "@/lib/pv-compute";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardInputs {
  drugName: string;
  benefitName: string;
  benefitEffectiveness: number; // 0-100
  benefitImportance: number; // 1-5
  riskName: string;
  riskFrequency: number; // 0-100
  riskSeriousness: number; // 1-5
}

const DEFAULT_INPUTS: WizardInputs = {
  drugName: "",
  benefitName: "",
  benefitEffectiveness: 50,
  benefitImportance: 3,
  riskName: "",
  riskFrequency: 20,
  riskSeriousness: 3,
};

// ─── Verdict helpers ──────────────────────────────────────────────────────────

function qbriTrafficLevel(qbri: number): TrafficLevel {
  if (qbri > 2.0) return "green";
  if (qbri > 1.0) return "yellow";
  return "red";
}

function qbriPlainEnglish(
  qbri: number,
  drug: string,
  benefit: string,
  risk: string,
): string {
  const drugLabel = drug || "this drug";
  const benefitLabel = benefit || "the main benefit";
  const riskLabel = risk || "the main risk";

  if (qbri > 2.0) {
    return `The benefits of ${drugLabel} (${benefitLabel}) outweigh the risks (${riskLabel}) by a comfortable margin. Based on these inputs, the benefit-risk profile is favorable.`;
  }
  if (qbri > 1.0) {
    return `${drugLabel} shows a marginal benefit-risk balance. The benefits (${benefitLabel}) slightly outweigh the risks (${riskLabel}), but the margin is narrow — close monitoring is recommended.`;
  }
  return `At these values, the risks of ${drugLabel} (${riskLabel}) outweigh the benefits (${benefitLabel}). This may mean the inputs need re-evaluation, or this drug is better suited to a more specific patient population.`;
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function BenefitRiskWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<WizardInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<QbriResult | null>(null);

  const set = useCallback(
    <K extends keyof WizardInputs>(key: K, value: WizardInputs[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleCompute = useCallback(() => {
    const r = computeQbri(
      [
        {
          name: inputs.benefitName || "Benefit",
          weight: inputs.benefitImportance / 5,
          score: inputs.benefitEffectiveness / 100,
        },
      ],
      [
        {
          name: inputs.riskName || "Risk",
          weight: inputs.riskSeriousness / 5,
          score: inputs.riskFrequency / 100,
        },
      ],
    );
    setResult(r);
    setCurrentStep(3);
  }, [inputs]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setInputs(DEFAULT_INPUTS);
    setResult(null);
  }, []);

  const steps: Step[] = useMemo(
    () => [
      // ── Step 1: The Drug ──────────────────────────────────────────────────
      {
        title: "The Drug",
        description:
          "Start by naming the drug or treatment you want to evaluate.",
        content: (
          <div className="space-y-6">
            <TipBox>
              <strong>What is benefit-risk analysis?</strong> Every drug has
              things it does well (benefits) and things that can go wrong
              (risks). We compare them to decide if the drug is worth taking.
              You&apos;ll enter one key benefit and one key risk to get your
              answer.
            </TipBox>
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                Drug or treatment name
              </label>
              <input
                type="text"
                value={inputs.drugName}
                onChange={(e) => set("drugName", e.target.value)}
                placeholder="e.g., Metformin, Aspirin, Warfarin…"
                className="mt-1 w-full border border-white/[0.12] bg-black/20 px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-cyan/40 focus:outline-none"
              />
            </div>
            <TechnicalStuffBox>
              This wizard calculates the{" "}
              <JargonBuster
                term="QBRI"
                definition="Quantitative Benefit-Risk Index — a ratio where benefit total ÷ risk total > 2.0 is favorable, 1.0–2.0 is marginal, and < 1.0 is unfavorable. Reference: CIOMS Working Group IV, Mt-Isa et al. (2014)."
              >
                QBRI
              </JargonBuster>{" "}
              — a quantitative benefit-risk index developed by{" "}
              <JargonBuster
                term="CIOMS"
                definition="Council for International Organizations of Medical Sciences — an international body that develops ethical and scientific guidelines for drug safety and clinical research."
              >
                CIOMS
              </JargonBuster>{" "}
              Working Group IV.
            </TechnicalStuffBox>
          </div>
        ),
      },

      // ── Step 2: The Benefits ──────────────────────────────────────────────
      {
        title: "The Benefits",
        description:
          "What does this drug do well? How effective is it and how important is that?",
        content: (
          <div className="space-y-6">
            <TipBox>
              Think about the main reason a doctor would prescribe this drug —
              for example, &quot;lowers blood sugar&quot; or &quot;prevents
              blood clots.&quot; Then estimate how well it works (0 =
              doesn&apos;t work at all, 100% = works perfectly every time).
            </TipBox>
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                Main benefit
              </label>
              <input
                type="text"
                value={inputs.benefitName}
                onChange={(e) => set("benefitName", e.target.value)}
                placeholder="e.g., Lowers blood sugar, Reduces clot risk…"
                className="mt-1 w-full border border-white/[0.12] bg-black/20 px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-emerald-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                How well does it work?{" "}
                <span className="text-emerald-400">
                  {inputs.benefitEffectiveness}%
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={inputs.benefitEffectiveness}
                onChange={(e) =>
                  set("benefitEffectiveness", parseInt(e.target.value, 10))
                }
                className="mt-2 w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-dim/30">
                <span>0% — doesn&apos;t work</span>
                <span>100% — works perfectly</span>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                How important is this benefit?{" "}
                <span className="text-emerald-400">
                  {inputs.benefitImportance} / 5
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={inputs.benefitImportance}
                onChange={(e) =>
                  set("benefitImportance", parseInt(e.target.value, 10))
                }
                className="mt-2 w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-dim/30">
                <span>1 — minor benefit</span>
                <span>5 — life-critical</span>
              </div>
            </div>
          </div>
        ),
      },

      // ── Step 3: The Risks ─────────────────────────────────────────────────
      {
        title: "The Risks",
        description:
          "What can go wrong? How often does it happen and how serious is it?",
        content: (
          <div className="space-y-6">
            <TipBox>
              Focus on the most clinically significant side effect for this
              drug. You can find these in the prescribing information under{" "}
              <JargonBuster
                term="Adverse Reactions"
                definition="Side effects or unintended effects reported in patients who took the drug during clinical trials or after it was approved. Listed in the drug label."
              >
                Adverse Reactions
              </JargonBuster>
              .
            </TipBox>
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                Main risk / side effect
              </label>
              <input
                type="text"
                value={inputs.riskName}
                onChange={(e) => set("riskName", e.target.value)}
                placeholder="e.g., Nausea, Bleeding, Kidney damage…"
                className="mt-1 w-full border border-white/[0.12] bg-black/20 px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-red-500/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                How often does this happen?{" "}
                <span className="text-red-400">{inputs.riskFrequency}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={inputs.riskFrequency}
                onChange={(e) =>
                  set("riskFrequency", parseInt(e.target.value, 10))
                }
                className="mt-2 w-full accent-red-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-dim/30">
                <span>0% — never</span>
                <span>100% — every patient</span>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                How serious is it?{" "}
                <span className="text-red-400">
                  {inputs.riskSeriousness} / 5
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={inputs.riskSeriousness}
                onChange={(e) =>
                  set("riskSeriousness", parseInt(e.target.value, 10))
                }
                className="mt-2 w-full accent-red-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-dim/30">
                <span>1 — minor inconvenience</span>
                <span>5 — life-threatening</span>
              </div>
            </div>
          </div>
        ),
      },

      // ── Step 4: The Verdict ───────────────────────────────────────────────
      {
        title: "The Verdict",
        description:
          "Here is what the numbers say about this drug's benefit-risk balance.",
        content: result ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <TrafficLight
                level={qbriTrafficLevel(result.qbri)}
                label={result.interpretation}
              />
              <div className="text-center">
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                  QBRI Score
                </p>
                <p className="text-5xl font-extrabold font-mono tabular-nums text-white">
                  {isFinite(result.qbri) ? result.qbri.toFixed(2) : "∞"}
                </p>
              </div>
            </div>

            <div className="border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-slate-dim/70 leading-relaxed">
              {qbriPlainEnglish(
                result.qbri,
                inputs.drugName,
                inputs.benefitName,
                inputs.riskName,
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-[9px] font-mono">
              <div className="border border-emerald-500/20 bg-emerald-500/5 p-2">
                <p className="text-emerald-400 font-bold text-xs">&gt; 2.0</p>
                <p className="text-slate-dim/40 mt-1">Favorable</p>
              </div>
              <div className="border border-gold/20 bg-gold/5 p-2">
                <p className="text-gold font-bold text-xs">1.0 – 2.0</p>
                <p className="text-slate-dim/40 mt-1">Marginal</p>
              </div>
              <div className="border border-red-500/20 bg-red-500/5 p-2">
                <p className="text-red-400 font-bold text-xs">&lt; 1.0</p>
                <p className="text-slate-dim/40 mt-1">Unfavorable</p>
              </div>
            </div>

            <TechnicalStuffBox>
              QBRI = Σ(benefit weight × effectiveness) ÷ Σ(risk weight ×
              frequency). Benefit: weight{" "}
              {(inputs.benefitImportance / 5).toFixed(2)} × score{" "}
              {(inputs.benefitEffectiveness / 100).toFixed(2)} ={" "}
              {result.benefitTotal.toFixed(3)}. Risk: weight{" "}
              {(inputs.riskSeriousness / 5).toFixed(2)} × score{" "}
              {(inputs.riskFrequency / 100).toFixed(2)} ={" "}
              {result.riskTotal.toFixed(3)}. QBRI ={" "}
              {result.benefitTotal.toFixed(3)} ÷ {result.riskTotal.toFixed(3)} ={" "}
              {isFinite(result.qbri) ? result.qbri.toFixed(3) : "∞"}.
            </TechnicalStuffBox>

            <button
              type="button"
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 border border-white/10 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition hover:border-white/20 hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Start Over
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Computing benefit-risk balance…
            </p>
          </div>
        ),
      },
    ],
    [inputs, result, handleReset, set],
  );

  const handleNext = useCallback(() => {
    if (currentStep === 2) {
      handleCompute();
    } else {
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    }
  }, [currentStep, handleCompute, steps.length]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Benefit-Risk Analysis / Guided</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Is This Drug Worth the Risk?
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          A guided benefit-risk assessment in four steps — no formulas required.
        </p>
      </header>

      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onNext={currentStep < steps.length - 1 ? handleNext : undefined}
        onBack={currentStep > 0 ? handleBack : undefined}
      />

      {/* Station wire */}
      <div className="max-w-2xl mx-auto mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">QBRI computed client-side via pv-compute. AI agents compute identical scores at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/benefit-risk-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass B:R Lab
        </a>
      </div>
    </div>
  );
}
