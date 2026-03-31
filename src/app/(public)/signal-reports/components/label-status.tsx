"use client";

import type { SignalResult } from "@/lib/pv-compute/signal-detection";

interface LabelStatusProps {
  onLabel: boolean;
  labelSections: string[];
  labelQuote: string;
  drug: string;
  event: string;
  /** Optional signal result for enriched label context. */
  signal?: SignalResult;
}

export function LabelStatus({
  onLabel,
  labelSections,
  labelQuote,
  drug,
  event,
}: LabelStatusProps) {
  return (
    <div className="border border-white/[0.12] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <span className="intel-label">Label Status</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[9px] font-mono text-slate-dim/30 capitalize">
          {drug}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* On/Off label badge */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 border text-sm font-bold font-headline tracking-wide ${
              onLabel
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                : "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-400"
            }`}
          >
            <LabelIcon onLabel={onLabel} />
            {onLabel ? "On Label" : "Not on Label"}
          </div>

          <p className="text-[10px] font-mono text-slate-dim/50">
            {onLabel
              ? `${event} is listed in the prescribing information.`
              : `${event} has not been identified in the prescribing information.`}
          </p>
        </div>

        {/* Label sections */}
        {onLabel && labelSections.length > 0 && (
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-2">
              Identified in sections
            </p>
            <div className="flex flex-wrap gap-2">
              {labelSections.map((section) => (
                <SectionBadge key={section} section={section} />
              ))}
            </div>
          </div>
        )}

        {/* Label quote */}
        {labelQuote && (
          <div className="border-l-2 border-amber-500/30 pl-4 py-1">
            <p className="text-[9px] font-mono uppercase tracking-widest text-amber-400/50 mb-1.5">
              Label text
            </p>
            <blockquote className="text-sm text-slate-light/80 leading-relaxed italic">
              &ldquo;{labelQuote}&rdquo;
            </blockquote>
          </div>
        )}

        {/* Regulatory implication */}
        <div className="border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/35 mb-1">
            Regulatory implication
          </p>
          <p className="text-[10px] font-mono text-slate-dim/60 leading-relaxed">
            {onLabel
              ? "Labeled risk. Cases are expected. Monitor for frequency changes and severity trends. Update cumulative case counts in PSUR/PBRER."
              : "Unlabeled risk. Each case requires expedited causality assessment. Consider label update if signal strengthens. ICH E2C(R2) applies."}
          </p>
        </div>
      </div>
    </div>
  );
}

function LabelIcon({ onLabel }: { onLabel: boolean }) {
  if (onLabel) {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 7L5.5 10.5L12 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 4.5V7.5M7 9.5V9.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionBadge({ section }: { section: string }) {
  const isBoxed = section.toLowerCase().includes("boxed");
  const isWarning =
    section.toLowerCase().includes("warning") ||
    section.toLowerCase().includes("precaution");

  let cls = "text-[9px] font-mono px-2 py-1 border tracking-wide uppercase";
  if (isBoxed) {
    cls += " border-red-500/30 bg-red-500/[0.06] text-red-400/80";
  } else if (isWarning) {
    cls += " border-amber-500/25 bg-amber-500/[0.05] text-amber-400/70";
  } else {
    cls += " border-white/[0.08] bg-white/[0.02] text-slate-dim/60";
  }

  return <span className={cls}>{section}</span>;
}
