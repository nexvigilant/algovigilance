"use client";

import { useState } from "react";
import type { ContingencyTable } from "@/lib/pv-compute/signal-detection";
import { useTrackOnMount } from "@/hooks/use-track-on-mount";
import { SignalWizard } from "./signal-wizard";
import { SignalCalculator } from "./signal-calculator";

export function SignalsPageShell() {
  const [mode, setMode] = useState<"guided" | "advanced">("guided");
  useTrackOnMount("feature_used", {
    feature: "signal-detection",
    route: "/nucleus/vigilance/signals",
  });

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex justify-end px-4 pt-4">
        <div
          className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1"
          role="tablist"
          aria-label="View mode"
        >
          <button
            role="tab"
            aria-selected={mode === "guided"}
            onClick={() => setMode("guided")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "guided"
                ? "bg-cyan-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Guided
          </button>
          <button
            role="tab"
            aria-selected={mode === "advanced"}
            onClick={() => setMode("advanced")}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "advanced"
                ? "bg-cyan-600 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Advanced Mode
          </button>
        </div>
      </div>

      {mode === "guided" ? <SignalWizard /> : <SignalCalculator />}
    </div>
  );
}
