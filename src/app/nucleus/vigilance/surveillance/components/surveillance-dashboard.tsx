"use client";

import { useState, useCallback, useMemo } from "react";
import { Activity, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nexcore, NexCoreError } from "@/lib/nexcore-client";
import { validateSignal, type SignalValidationResult } from "@/lib/pv-compute";

type SurveillanceMethod = "sprt" | "cusum" | "weibull-tto";

const SURVEILLANCE_TABS: {
  key: SurveillanceMethod;
  label: string;
  description: string;
}[] = [
  {
    key: "sprt",
    label: "SPRT",
    description:
      "Sequential Probability Ratio Test — continuous monitoring with early stopping boundaries",
  },
  {
    key: "cusum",
    label: "CUSUM",
    description:
      "Cumulative Sum control chart — detect sustained shifts in adverse event reporting rates",
  },
  {
    key: "weibull-tto",
    label: "Weibull TTO",
    description:
      "Weibull time-to-onset analysis — characterize temporal distribution of adverse events",
  },
];

interface SurveillanceResult {
  [key: string]: unknown;
}

function NumberInput({
  label,
  value,
  onChange,
  unit,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
        {label} {unit && <span className="text-red-400/30">({unit})</span>}
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-red-500/40 focus:outline-none"
      />
    </div>
  );
}

function SprtForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [observed, setObserved] = useState("25");
  const [expected, setExpected] = useState("15");
  const [alpha, setAlpha] = useState("0.05");
  const [beta, setBeta] = useState("0.20");
  const [rr, setRr] = useState("2.0");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Observed Cases"
          value={observed}
          onChange={setObserved}
          placeholder="25"
        />
        <NumberInput
          label="Expected Cases"
          value={expected}
          onChange={setExpected}
          placeholder="15"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <NumberInput
          label="Alpha (Type I)"
          value={alpha}
          onChange={setAlpha}
          placeholder="0.05"
        />
        <NumberInput
          label="Beta (Type II)"
          value={beta}
          onChange={setBeta}
          placeholder="0.20"
        />
        <NumberInput
          label="Relative Risk (H1)"
          value={rr}
          onChange={setRr}
          placeholder="2.0"
        />
      </div>
      <Button
        onClick={() =>
          onSubmit({
            observed: parseInt(observed, 10),
            expected: parseFloat(expected),
            alpha: parseFloat(alpha),
            beta: parseFloat(beta),
            relative_risk: parseFloat(rr),
          })
        }
        disabled={loading}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Run SPRT"
        )}
      </Button>
    </div>
  );
}

function CusumForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [values, setValues] = useState("2, 3, 5, 4, 7, 8, 12, 15, 11, 9");
  const [target, setTarget] = useState("5");
  const [threshold, setThreshold] = useState("10");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
          Observation sequence (comma-separated)
        </label>
        <input
          type="text"
          value={values}
          onChange={(e) => setValues(e.target.value)}
          className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white focus:border-red-500/40 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Target Mean"
          value={target}
          onChange={setTarget}
          placeholder="5"
        />
        <NumberInput
          label="Decision Threshold (H)"
          value={threshold}
          onChange={setThreshold}
          placeholder="10"
        />
      </div>
      <Button
        onClick={() =>
          onSubmit({
            values: values.split(",").map((v) => parseFloat(v.trim())),
            target: parseFloat(target),
            threshold: parseFloat(threshold),
          })
        }
        disabled={loading}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Run CUSUM"
        )}
      </Button>
    </div>
  );
}

function WeibullForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [times, setTimes] = useState("1, 3, 5, 7, 10, 14, 21, 30, 45, 60");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
          Time-to-onset values (comma-separated, days)
        </label>
        <input
          type="text"
          value={times}
          onChange={(e) => setTimes(e.target.value)}
          className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white focus:border-red-500/40 focus:outline-none"
        />
      </div>
      <Button
        onClick={() =>
          onSubmit({
            times: times.split(",").map((v) => parseFloat(v.trim())),
          })
        }
        disabled={loading}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Fit Weibull Distribution"
        )}
      </Button>
    </div>
  );
}

function decisionColor(decision: string): string {
  const d = decision.toLowerCase();
  if (d.includes("reject") || d.includes("signal") || d.includes("alarm"))
    return "text-red-400";
  if (d.includes("accept") || d.includes("no signal"))
    return "text-emerald-400";
  return "text-gold";
}

const VALIDATION_COLOR: Record<string, string> = {
  VALIDATED_SIGNAL: "text-red-400 border-red-500/30 bg-red-500/10",
  PROBABLE_SIGNAL: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  POSSIBLE_SIGNAL: "text-cyan/80 border-cyan/30 bg-cyan/10",
  NOISE: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

export function SurveillanceDashboard() {
  const [activeTab, setActiveTab] = useState<SurveillanceMethod>("sprt");
  const [result, setResult] = useState<SurveillanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valCriteria, setValCriteria] = useState({
    prr_above_threshold: false,
    case_count_sufficient: false,
    geographic_spread: false,
    temporal_pattern: false,
  });

  // Wire to pv-compute: validateSignal mirrors signal-validation-gate.yaml
  const signalValidation: SignalValidationResult = useMemo(
    () => validateSignal(valCriteria),
    [valCriteria],
  );

  const handleSubmit = useCallback(
    (params: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      setResult(null);

      nexcore
        .dispatch<SurveillanceResult>(
          "/api/nexcore/surveillance",
          activeTab,
          params,
        )
        .then((data) => setResult(data))
        .catch((err) =>
          setError(
            err instanceof NexCoreError ? err.message : "Request failed",
          ),
        )
        .finally(() => setLoading(false));
    },
    [activeTab],
  );

  const tabInfo = SURVEILLANCE_TABS.find((t) => t.key === activeTab);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Sequential Surveillance / NexCore Compute
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Sequential Surveillance
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Continuous safety monitoring with statistical decision boundaries
        </p>
        <p className="text-[9px] font-mono text-red-400/30 mt-1">
          NexCore server-side computation via kellnr-mcp
        </p>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {SURVEILLANCE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setResult(null);
              setError(null);
            }}
            className={`px-3 py-2 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                : "text-slate-dim/40 hover:text-white/60 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Description */}
      {tabInfo && (
        <p className="text-xs text-slate-dim/50 mb-4 font-mono">
          {tabInfo.description}
        </p>
      )}

      {/* Form */}
      <div className="border border-white/[0.12] bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-3.5 w-3.5 text-red-400/60" />
          <span className="intel-label">{tabInfo?.label} Parameters</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        {activeTab === "sprt" && (
          <SprtForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "cusum" && (
          <CusumForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "weibull-tto" && (
          <WeibullForm onSubmit={handleSubmit} loading={loading} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 border border-emerald-500/30 bg-emerald-500/5">
          <div className="px-4 py-2.5 border-b border-emerald-500/20">
            <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/60">
              NexCore Result — {tabInfo?.label}
            </span>
          </div>
          <div className="p-4 grid gap-3">
            {Object.entries(result).map(([key, value]) => {
              if (key === "success" || key === "method") return null;
              const isDecision = key === "decision" || key === "conclusion";
              const displayValue =
                typeof value === "number"
                  ? value.toFixed(6)
                  : typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : Array.isArray(value)
                      ? value
                          .map((v) =>
                            typeof v === "number" ? v.toFixed(4) : String(v),
                          )
                          .join(", ")
                      : String(value);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-white/[0.06] pb-2"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`text-sm font-mono font-bold tabular-nums ${
                      isDecision ? decisionColor(String(value)) : "text-white"
                    }`}
                  >
                    {displayValue}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* pv-compute: Signal Validation Gate */}
      <div className="mt-6 border border-white/[0.12] bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-3.5 w-3.5 text-cyan/60" />
          <span className="intel-label">Signal Validation Gate</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[8px] font-mono text-slate-dim/30">
            pv-compute · client-side
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(
            [
              {
                key: "prr_above_threshold",
                label: "PRR meets Evans criteria (≥ 2.0)",
              },
              {
                key: "case_count_sufficient",
                label: "Minimum case count (N ≥ 3)",
              },
              { key: "geographic_spread", label: "Multi-region reporting" },
              {
                key: "temporal_pattern",
                label: "Biologically plausible onset",
              },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={valCriteria[key]}
                onChange={(e) =>
                  setValCriteria((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
                className="accent-cyan-500"
              />
              <span className="text-[10px] font-mono text-white/70">
                {label}
              </span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1.5 border font-mono text-xs font-bold uppercase tracking-widest ${
              VALIDATION_COLOR[signalValidation.classification] ??
              "text-white border-white/[0.12]"
            }`}
          >
            {signalValidation.classification.replace(/_/g, " ")}
          </span>
          <span className="text-xs font-mono text-white/60">
            Confidence: {signalValidation.confidence}%
          </span>
        </div>
        <p className="text-[9px] font-mono text-slate-dim/40 mt-2">
          {signalValidation.next_action}
        </p>
      </div>
    </div>
  );
}
