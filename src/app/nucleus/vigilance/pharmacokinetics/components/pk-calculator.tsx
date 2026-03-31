"use client";

import { useState, useCallback } from "react";
import { Pill, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nexcore, NexCoreError } from "@/lib/nexcore-client";
import { classifyMetric, metricHealthColor } from "@/lib/pv-compute";

type PkMethod =
  | "auc"
  | "clearance"
  | "steady-state"
  | "volume-distribution"
  | "michaelis-menten";

const PK_TABS: { key: PkMethod; label: string; description: string }[] = [
  {
    key: "auc",
    label: "AUC",
    description: "Area under the concentration-time curve (linear trapezoidal)",
  },
  {
    key: "clearance",
    label: "Clearance",
    description: "Drug clearance from dose and AUC",
  },
  {
    key: "steady-state",
    label: "Steady State",
    description: "Time to reach steady-state concentration",
  },
  {
    key: "volume-distribution",
    label: "Vd",
    description: "Volume of distribution from dose and C0",
  },
  {
    key: "michaelis-menten",
    label: "Michaelis-Menten",
    description: "Non-linear elimination kinetics",
  },
];

interface PkResult {
  [key: string]: unknown;
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
}) {
  return (
    <div>
      <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
        {label} {unit && <span className="text-cyan/30">({unit})</span>}
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/20 focus:border-cyan/40 focus:outline-none"
      />
    </div>
  );
}

function AucForm({
  onSubmit,
  loading,
}: {
  onSubmit: (params: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [times, setTimes] = useState("0, 1, 2, 4, 8, 12, 24");
  const [concentrations, setConcentrations] = useState(
    "0, 4.2, 7.1, 8.5, 5.3, 2.8, 0.4",
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
          Time points (comma-separated, hours)
        </label>
        <input
          type="text"
          value={times}
          onChange={(e) => setTimes(e.target.value)}
          className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white focus:border-cyan/40 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
          Concentrations (comma-separated, ng/mL)
        </label>
        <input
          type="text"
          value={concentrations}
          onChange={(e) => setConcentrations(e.target.value)}
          className="w-full mt-1 bg-black/20 border border-white/[0.12] px-3 py-2 text-sm font-mono text-white focus:border-cyan/40 focus:outline-none"
        />
      </div>
      <Button
        onClick={() =>
          onSubmit({
            times: times.split(",").map((t) => parseFloat(t.trim())),
            concentrations: concentrations
              .split(",")
              .map((c) => parseFloat(c.trim())),
          })
        }
        disabled={loading}
        className="w-full bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Calculate AUC"
        )}
      </Button>
    </div>
  );
}

function ClearanceForm({
  onSubmit,
  loading,
}: {
  onSubmit: (params: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [dose, setDose] = useState("500");
  const [auc, setAuc] = useState("120");

  return (
    <div className="space-y-4">
      <NumberInput
        label="Dose"
        value={dose}
        onChange={setDose}
        unit="mg"
        placeholder="500"
      />
      <NumberInput
        label="AUC"
        value={auc}
        onChange={setAuc}
        unit="ng*h/mL"
        placeholder="120"
      />
      <Button
        onClick={() =>
          onSubmit({ dose: parseFloat(dose), auc: parseFloat(auc) })
        }
        disabled={loading}
        className="w-full bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Calculate Clearance"
        )}
      </Button>
    </div>
  );
}

function SteadyStateForm({
  onSubmit,
  loading,
}: {
  onSubmit: (params: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [halfLife, setHalfLife] = useState("6");
  const [dosingInterval, setDosingInterval] = useState("8");

  return (
    <div className="space-y-4">
      <NumberInput
        label="Half-life"
        value={halfLife}
        onChange={setHalfLife}
        unit="hours"
        placeholder="6"
      />
      <NumberInput
        label="Dosing Interval"
        value={dosingInterval}
        onChange={setDosingInterval}
        unit="hours"
        placeholder="8"
      />
      <Button
        onClick={() =>
          onSubmit({
            half_life: parseFloat(halfLife),
            dosing_interval: parseFloat(dosingInterval),
          })
        }
        disabled={loading}
        className="w-full bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Calculate Steady State"
        )}
      </Button>
    </div>
  );
}

function VolumeDistributionForm({
  onSubmit,
  loading,
}: {
  onSubmit: (params: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [dose, setDose] = useState("500");
  const [c0, setC0] = useState("10");

  return (
    <div className="space-y-4">
      <NumberInput
        label="Dose"
        value={dose}
        onChange={setDose}
        unit="mg"
        placeholder="500"
      />
      <NumberInput
        label="Initial Concentration (C0)"
        value={c0}
        onChange={setC0}
        unit="ng/mL"
        placeholder="10"
      />
      <Button
        onClick={() => onSubmit({ dose: parseFloat(dose), c0: parseFloat(c0) })}
        disabled={loading}
        className="w-full bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Calculate Vd"
        )}
      </Button>
    </div>
  );
}

function MichaelisMentenForm({
  onSubmit,
  loading,
}: {
  onSubmit: (params: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [substrate, setSubstrate] = useState("500");
  const [vMax, setVMax] = useState("1000");
  const [km, setKm] = useState("200");

  return (
    <div className="space-y-4">
      <NumberInput
        label="Substrate Concentration [S]"
        value={substrate}
        onChange={setSubstrate}
        unit="uM"
        placeholder="500"
      />
      <NumberInput
        label="Vmax"
        value={vMax}
        onChange={setVMax}
        unit="uM/min"
        placeholder="1000"
      />
      <NumberInput
        label="Km"
        value={km}
        onChange={setKm}
        unit="uM"
        placeholder="200"
      />
      <Button
        onClick={() =>
          onSubmit({
            substrate: parseFloat(substrate),
            v_max: parseFloat(vMax),
            k_m: parseFloat(km),
          })
        }
        disabled={loading}
        className="w-full bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest py-3"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin mx-auto" />
        ) : (
          "Calculate Rate"
        )}
      </Button>
    </div>
  );
}

export function PkCalculator() {
  const [activeTab, setActiveTab] = useState<PkMethod>("auc");
  const [result, setResult] = useState<PkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (params: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      setResult(null);

      nexcore
        .dispatch<PkResult>("/api/nexcore/pk", activeTab, params)
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

  const tabInfo = PK_TABS.find((t) => t.key === activeTab);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Pharmacokinetics / NexCore Compute
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          PK Calculator
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Pharmacokinetic parameter computation via Kellnr crate registry
        </p>
        <p className="text-[9px] font-mono text-cyan/30 mt-1">
          NexCore server-side computation via kellnr-mcp
        </p>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {PK_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setResult(null);
              setError(null);
            }}
            className={`px-3 py-2 text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-cyan/10 text-cyan border border-cyan/30"
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
          <Pill className="h-3.5 w-3.5 text-cyan/60" />
          <span className="intel-label">{tabInfo?.label} Parameters</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        {activeTab === "auc" && (
          <AucForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "clearance" && (
          <ClearanceForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "steady-state" && (
          <SteadyStateForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "volume-distribution" && (
          <VolumeDistributionForm onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === "michaelis-menten" && (
          <MichaelisMentenForm onSubmit={handleSubmit} loading={loading} />
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
              const displayValue =
                typeof value === "number"
                  ? value.toFixed(6)
                  : typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : String(value);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-white/[0.06] pb-2"
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-mono font-bold text-white tabular-nums">
                    {displayValue}
                    {typeof value === "number" &&
                      (key === "saturation_fraction" ||
                        key === "accumulation_factor" ||
                        key.includes("ratio")) &&
                      (() => {
                        const pct =
                          key === "saturation_fraction"
                            ? value * 100
                            : Math.min(value * 10, 100);
                        const metric = classifyMetric(key, pct);
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
