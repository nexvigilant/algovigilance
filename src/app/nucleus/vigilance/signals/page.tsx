"use client";

import { useState } from "react";
import { SignalWizard } from "./components/signal-wizard";
import { SignalCalculator } from "./components/signal-calculator";

export default function SignalsPage() {
  const [professionalMode, setProfessionalMode] = useState(false);

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex justify-end px-4 pt-4">
        <button
          type="button"
          onClick={() => setProfessionalMode((v) => !v)}
          className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
        >
          {professionalMode ? "Guided Mode" : "Professional Mode"}
        </button>
      </div>

      {professionalMode ? <SignalCalculator /> : <SignalWizard />}
    </div>
  );
}
