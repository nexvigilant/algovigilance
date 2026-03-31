"use client";

import { useState, useEffect } from "react";
import { WarningBox, JargonBuster } from "@/components/pv-for-nexvigilants";
import type { CompositeHealth } from "@/lib/pv-compute/flywheel";
import { CheckCircle, Circle, AlertTriangle } from "lucide-react";
import type { ActionRoute, CompositeResult } from "./flywheel-types";

interface FlywheelActionChecklistProps {
  route: ActionRoute;
  composite: CompositeResult;
}

const STORAGE_KEY = "flywheel-checklist-completed";

function loadCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // Corrupted storage — start fresh
  }
  return new Set();
}

function saveCompleted(completed: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  } catch {
    // Storage full or unavailable — skip
  }
}

export function FlywheelActionChecklist({
  route,
  composite,
}: FlywheelActionChecklistProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCompleted(loadCompleted());
  }, []);

  function toggle(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveCompleted(next);
      return next;
    });
  }

  if (route.steps.length === 0) return null;

  const completedCount = route.steps.filter((s) => completed.has(s.id)).length;
  const allDone = completedCount === route.steps.length;

  const isUrgent = composite.action === "INTERVENE";

  return (
    <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
      <div className="flex items-center gap-3 mb-1">
        <AlertTriangle
          className={`h-5 w-5 ${isUrgent ? "text-red-400" : "text-amber-400"}`}
        />
        <h2 className="text-sm font-semibold text-foreground">
          {isUrgent ? "Urgent: What To Do Right Now" : "Recommended Actions"}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Strategy: {route.strategy} — {completedCount}/{route.steps.length}{" "}
        complete. Steps may reference{" "}
        <JargonBuster
          term="Micrograms"
          definition="Tiny self-contained decision programs — each one encodes one PV rule. The flywheel runs these to detect problems and measure progress."
        >
          micrograms
        </JargonBuster>{" "}
        (decision programs) and{" "}
        <JargonBuster
          term="Emitters"
          definition="Rust modules that send events into the flywheel when something is detected or fixed. Silent emitters mean the flywheel loses visibility."
        >
          emitters
        </JargonBuster>
        .
      </p>

      {isUrgent && (
        <WarningBox>
          The flywheel has stalled. Complete these steps in order to restore
          momentum. Don&apos;t skip ahead — each step builds on the previous
          one.
        </WarningBox>
      )}

      <div className="mt-4 space-y-2">
        {route.steps.map((step) => {
          const done = completed.has(step.id);
          return (
            <button
              key={step.id}
              onClick={() => toggle(step.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                done
                  ? "bg-emerald-500/5 border border-emerald-500/20"
                  : "bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12]"
              }`}
              aria-label={`${done ? "Mark incomplete" : "Mark complete"}: ${step.label}`}
            >
              {done ? (
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    done ? "text-emerald-300 line-through" : "text-foreground"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.detail}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-sm font-semibold text-emerald-300">
            All actions complete — refresh the page to check if the flywheel
            recovered.
          </p>
        </div>
      )}
    </div>
  );
}
