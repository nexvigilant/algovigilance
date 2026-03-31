"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Activity, RotateCcw } from "lucide-react";
import { getOrgThresholds, updateOrgThresholds } from "@/lib/actions/tenant";
import { PV_SIGNAL_THRESHOLDS } from "@/lib/constants/pv-thresholds";
import type { ResolvedSignalThresholds } from "@/lib/constants/pv-thresholds";

const THRESHOLD_FIELDS: {
  key: keyof ResolvedSignalThresholds;
  label: string;
  description: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "prr",
    label: "PRR",
    description: "Proportional Reporting Ratio signal threshold",
    defaultValue: PV_SIGNAL_THRESHOLDS.prr,
    min: 0.1,
    max: 10,
    step: 0.1,
  },
  {
    key: "chiSquare",
    label: "Chi-Square",
    description: "Chi-square statistic (p < 0.05 at 1 df = 3.841)",
    defaultValue: PV_SIGNAL_THRESHOLDS.chiSquare,
    min: 0.1,
    max: 20,
    step: 0.001,
  },
  {
    key: "rorLowerCI",
    label: "ROR Lower CI",
    description: "Reporting Odds Ratio lower 95% confidence interval",
    defaultValue: PV_SIGNAL_THRESHOLDS.rorLowerCI,
    min: 0,
    max: 5,
    step: 0.1,
  },
  {
    key: "ic025",
    label: "IC025",
    description: "Information Component lower 95% credible interval",
    defaultValue: PV_SIGNAL_THRESHOLDS.ic025,
    min: -2,
    max: 5,
    step: 0.1,
  },
  {
    key: "eb05",
    label: "EB05",
    description: "Empirical Bayes lower 5th percentile",
    defaultValue: PV_SIGNAL_THRESHOLDS.eb05,
    min: 0.1,
    max: 10,
    step: 0.1,
  },
];

interface SignalThresholdsCardProps {
  tenantId: string;
}

export function SignalThresholdsCard({ tenantId }: SignalThresholdsCardProps) {
  const [thresholds, setThresholds] = useState<ResolvedSignalThresholds | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThresholds = useCallback(async () => {
    try {
      const data = await getOrgThresholds(tenantId);
      setThresholds(data);
    } catch {
      setError("Failed to load thresholds");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadThresholds();
  }, [loadThresholds]);

  function handleChange(key: keyof ResolvedSignalThresholds, value: string) {
    if (!thresholds) return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setThresholds({ ...thresholds, [key]: num });
    setSaved(false);
  }

  function handleReset() {
    setThresholds({ ...PV_SIGNAL_THRESHOLDS });
    setSaved(false);
  }

  async function handleSave() {
    if (!thresholds) return;
    setSaving(true);
    setError(null);

    const result = await updateOrgThresholds(tenantId, {
      prr: thresholds.prr,
      chiSquare: thresholds.chiSquare,
      rorLowerCI: thresholds.rorLowerCI,
      ic025: thresholds.ic025,
      eb05: thresholds.eb05,
    });

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error || "Failed to save thresholds");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <Card className="bg-nex-surface border-nex-light">
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan/20 border-t-cyan" />
        </CardContent>
      </Card>
    );
  }

  const isDefault =
    thresholds &&
    THRESHOLD_FIELDS.every((f) => thresholds[f.key] === f.defaultValue);

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader>
        <CardTitle className="text-slate-light flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan" />
          Signal Detection Thresholds
        </CardTitle>
        <CardDescription className="text-slate-dim">
          Customize when PV signals are flagged. Evans criteria defaults are
          standard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {THRESHOLD_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label className="text-slate-dim text-xs">{field.label}</Label>
                <span className="text-[10px] text-slate-dim/60">
                  default: {field.defaultValue}
                </span>
              </div>
              <Input
                type="number"
                value={thresholds?.[field.key] ?? field.defaultValue}
                onChange={(e) => handleChange(field.key, e.target.value)}
                min={field.min}
                max={field.max}
                step={field.step}
                className="bg-nex-dark border-nex-light text-slate-light"
              />
              <p className="text-[10px] text-slate-dim/80">
                {field.description}
              </p>
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {saved && <p className="text-xs text-emerald-400">Thresholds saved</p>}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!!isDefault}
            className="text-slate-dim hover:text-slate-light text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Evans Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent"
          >
            {saving ? "Saving..." : "Save Thresholds"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
