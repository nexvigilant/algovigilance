"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { wizard, type WizardProgress } from "@/lib/alerts-api";
import {
  Wand2,
  ArrowLeft,
  ArrowRight,
  Building2,
  Shield,
  Lock,
  ClipboardList,
  Cpu,
  CheckCircle,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    num: 1,
    name: "Organization Setup",
    description: "Tell us about your healthcare facility",
    icon: Building2,
  },
  {
    num: 2,
    name: "Admin Security",
    description: "Secure your administrator account",
    icon: Shield,
  },
  {
    num: 3,
    name: "Data Protection",
    description: "Set up encryption and backups",
    icon: Lock,
  },
  {
    num: 4,
    name: "Vendor Assessment",
    description: "Manage third-party risks",
    icon: ClipboardList,
  },
  {
    num: 5,
    name: "Device Security",
    description: "Secure medical devices",
    icon: Cpu,
  },
  {
    num: 6,
    name: "HIPAA Compliance",
    description: "Final compliance checks",
    icon: CheckCircle,
  },
  {
    num: 7,
    name: "Setup Complete",
    description: "Review and activate your security",
    icon: PartyPopper,
  },
] as const;

export default function ComplianceWizard() {
  const { loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState<WizardProgress | null>(null);
  const [stepData, setStepData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      try {
        const p = await wizard.getProgress();
        setProgress(p);
        setCurrentStep(p.current_step || 1);
      } catch {
        // Fresh wizard — no progress saved yet
        setCurrentStep(1);
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [authLoading]);

  useEffect(() => {
    if (dataLoading) return;
    async function loadStep() {
      try {
        const step = await wizard.getStep(currentStep);
        setStepData(step.fields || {});
      } catch {
        setStepData({});
      }
    }
    loadStep();
  }, [currentStep, dataLoading]);

  const saveAndAdvance = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await wizard.saveStep(currentStep, stepData);
      if (currentStep < 7) {
        setCurrentStep((s) => s + 1);
      } else {
        await wizard.complete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [currentStep, stepData]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)]" aria-busy="true">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-4 w-full mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const step = STEPS[currentStep - 1];
  const Icon = step.icon;
  const completedSteps = progress?.completed_steps || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      <header className="mb-golden-4">
        <Link
          href="/nucleus/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-dim/50 hover:text-cyan transition-colors mb-golden-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Alerts & Compliance
        </Link>
        <div className="flex items-center gap-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-violet-400/30 bg-violet-400/5">
            <Wand2 className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white">
              Compliance Setup
            </h1>
            <p className="text-xs text-slate-dim/50 font-mono">
              7-Step Guided Configuration
            </p>
          </div>
        </div>
      </header>

      {/* Step Progress Bar */}
      <div className="flex items-center gap-2 mb-golden-4">
        {STEPS.map((s) => (
          <div
            key={s.num}
            className={`h-1.5 flex-1 transition-all ${
              completedSteps.includes(s.num)
                ? "bg-emerald-400"
                : s.num === currentStep
                  ? "bg-violet-400"
                  : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>

      {/* Current Step */}
      <div className="border border-white/[0.08] bg-white/[0.02] p-8">
        <div className="flex items-center gap-3 mb-golden-3">
          <div className="flex h-10 w-10 items-center justify-center border border-violet-400/20 bg-violet-400/5">
            <Icon className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">
              Step {currentStep} of 7
            </p>
            <h2 className="font-headline text-lg font-bold text-white">
              {step.name}
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-dim/60 mb-golden-3">
          {step.description}
        </p>

        {/* Step content placeholder — data from API */}
        <div className="border border-dashed border-white/[0.1] bg-white/[0.01] p-6 mb-golden-3 text-center">
          <p className="text-xs text-slate-dim/40">
            Step fields load from the alerts backend. Connect the backend at
            ALERTS_API_URL to see form fields.
          </p>
        </div>

        {error && (
          <div className="border border-red-400/30 bg-red-400/5 p-3 mb-golden-3">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono border border-white/20 text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Previous
          </button>
          <button
            onClick={saveAndAdvance}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono border border-violet-400/40 text-violet-300 hover:bg-violet-400/10 disabled:opacity-50 transition-colors"
          >
            {saving
              ? "Saving..."
              : currentStep === 7
                ? "Complete Setup"
                : "Save & Continue"}
            {!saving && currentStep < 7 && <ArrowRight className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
