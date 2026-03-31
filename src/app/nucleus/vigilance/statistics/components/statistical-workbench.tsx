"use client";

import { useState, useCallback } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nexcore, NexCoreError } from "@/lib/nexcore-client";
import { classifyMetric, metricHealthColor } from "@/lib/pv-compute";

type StatsMethod =
  | "welch-ttest"
  | "ols-regression"
  | "poisson-ci"
  | "bayesian-posterior"
  | "entropy";

const STATS_TABS: { key: StatsMethod; label: string; description: string }[] = [
  {
    key: "welch-ttest",
    label: "Welch t-test",
    description: "Two-sample t-test with unequal variances",
  },
  {
    key: "ols-regression",
    label: "OLS Regression",
    description: "Ordinary least squares linear regression",
  },
  {
    key: "poisson-ci",
    label: "Poisson CI",
    description: "Confidence interval for Poisson rate parameter",
  },
  {
    key: "bayesian-posterior",
    label: "Bayesian",
    description: "Bayesian posterior probability computation",
  },
  {
    key: "entropy",
    label: "Entropy",
    description: "Shannon entropy of a probability distribution",
  },
];

interface StatsResult {
  [key: string]: unknown;
}

function ArrayInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-amber-500/40 focus:outline-none"
      />
    </div>
  );
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
        {label} {unit && <span className="text-amber-400/30">({unit})</span>}
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-amber-500/40 focus:outline-none"
      />
    </div>
  );
}

function WelchForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [sample1, setSample1] = useState("23.1, 25.4, 22.8, 24.5, 26.1, 23.9");
  const [sample2, setSample2] = useState("20.3, 21.7, 19.5, 22.1, 20.8, 21.2");

  return (
    <div className="space-y-4">
      <ArrayInput
        label="Sample 1 (comma-separated)"
        value={sample1}
        onChange={setSample1}
        placeholder="23.1, 25.4, ..."
      />
      <ArrayInput
        label="Sample 2 (comma-separated)"
        value={sample2}
        onChange={setSample2}
        placeholder="20.3, 21.7, ..."
      />
      <Button
        onClick={() =>
          onSubmit({
            sample1: sample1.split(",").map((v) => parseFloat(v.trim())),
            sample2: sample2.split(",").map((v) => parseFloat(v.trim())),
          })
        }
        disabled={loading}
        className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Run Welch t-test"
        )}
      </Button>
    </div>
  );
}

function OlsForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [x, setX] = useState("1, 2, 3, 4, 5, 6, 7, 8");
  const [y, setY] = useState("2.1, 4.3, 5.8, 8.2, 9.5, 12.1, 13.8, 16.2");

  return (
    <div className="space-y-4">
      <ArrayInput
        label="X values (independent variable)"
        value={x}
        onChange={setX}
        placeholder="1, 2, 3, ..."
      />
      <ArrayInput
        label="Y values (dependent variable)"
        value={y}
        onChange={setY}
        placeholder="2.1, 4.3, ..."
      />
      <Button
        onClick={() =>
          onSubmit({
            x: x.split(",").map((v) => parseFloat(v.trim())),
            y: y.split(",").map((v) => parseFloat(v.trim())),
          })
        }
        disabled={loading}
        className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Run OLS Regression"
        )}
      </Button>
    </div>
  );
}

function PoissonForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [count, setCount] = useState("15");
  const [confidence, setConfidence] = useState("0.95");

  return (
    <div className="space-y-4">
      <NumberInput
        label="Observed Count"
        value={count}
        onChange={setCount}
        placeholder="15"
      />
      <NumberInput
        label="Confidence Level"
        value={confidence}
        onChange={setConfidence}
        placeholder="0.95"
      />
      <Button
        onClick={() =>
          onSubmit({
            count: parseInt(count, 10),
            confidence_level: parseFloat(confidence),
          })
        }
        disabled={loading}
        className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Compute Poisson CI"
        )}
      </Button>
    </div>
  );
}

function BayesianForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [priorAlpha, setPriorAlpha] = useState("1");
  const [priorBeta, setPriorBeta] = useState("1");
  const [successes, setSuccesses] = useState("7");
  const [trials, setTrials] = useState("10");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Prior Alpha"
          value={priorAlpha}
          onChange={setPriorAlpha}
          placeholder="1"
        />
        <NumberInput
          label="Prior Beta"
          value={priorBeta}
          onChange={setPriorBeta}
          placeholder="1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Successes"
          value={successes}
          onChange={setSuccesses}
          placeholder="7"
        />
        <NumberInput
          label="Trials"
          value={trials}
          onChange={setTrials}
          placeholder="10"
        />
      </div>
      <Button
        onClick={() =>
          onSubmit({
            prior_alpha: parseFloat(priorAlpha),
            prior_beta: parseFloat(priorBeta),
            successes: parseInt(successes, 10),
            trials: parseInt(trials, 10),
          })
        }
        disabled={loading}
        className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Compute Posterior"
        )}
      </Button>
    </div>
  );
}

function EntropyForm({
  onSubmit,
  loading,
}: {
  onSubmit: (p: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [probs, setProbs] = useState("0.25, 0.25, 0.25, 0.25");

  return (
    <div className="space-y-4">
      <ArrayInput
        label="Probabilities (comma-separated, must sum to 1.0)"
        value={probs}
        onChange={setProbs}
        placeholder="0.25, 0.25, 0.25, 0.25"
      />
      <Button
        onClick={() =>
          onSubmit({
            probabilities: probs.split(",").map((v) => parseFloat(v.trim())),
          })
        }
        disabled={loading}
        className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Compute Entropy"
        )}
      </Button>
    </div>
  );
}

export function StatisticalWorkbench() {
  const [activeTab, setActiveTab] = useState<StatsMethod>("welch-ttest");
  const [result, setResult] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (params: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      setResult(null);

      nexcore
        .dispatch<StatsResult>("/api/nexcore/stats", activeTab, params)
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

  const tabInfo = STATS_TABS.find((t) => t.key === activeTab);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Advanced Statistics / NexCore Compute
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Statistical Workbench
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Hypothesis testing, regression, and information theory via Kellnr
          compute crates
        </p>
        <p className="text-[9px] font-mono text-amber-400/30 mt-1">
          NexCore server-side computation via kellnr-mcp
        </p>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setResult(null);
              setError(null);
            }}
            className={`px-3 py-2 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
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
          <BarChart3 className="h-3.5 w-3.5 text-amber-400/60" />
          <span className="intel-label">{tabInfo?.label} Parameters</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        {activeTab === "welch-ttest" && (
          <WelchForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "ols-regression" && (
          <OlsForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "poisson-ci" && (
          <PoissonForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "bayesian-posterior" && (
          <BayesianForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "entropy" && (
          <EntropyForm onSubmit={handleSubmit} loading={loading} />
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
              const isSignificant =
                key === "p_value" && typeof value === "number" && value < 0.05;
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
                      isSignificant ? "text-emerald-400" : "text-white"
                    }`}
                  >
                    {displayValue}
                    {isSignificant && (
                      <span className="ml-2 text-[9px] text-emerald-400/60">
                        *sig
                      </span>
                    )}
                    {key === "p_value" &&
                      typeof value === "number" &&
                      (() => {
                        const metric = classifyMetric(
                          "p_value",
                          (1 - value) * 100,
                        );
                        return (
                          <span
                            className={`ml-2 text-[8px] font-bold px-1.5 py-0.5 border ${metricHealthColor(metric.health)}`}
                          >
                            {metric.health}
                          </span>
                        );
                      })()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
