"use client";

import type { SignalResult } from "@/lib/pv-compute/signal-detection";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useCallback } from "react";
import type { VigilanceDomain } from "./vigilance-hub-config";

const STORAGE_KEY = "nex-vigilance-domain";

type DomainFilter = VigilanceDomain | "all";

const DOMAIN_OPTIONS: {
  value: DomainFilter;
  label: string;
  shortLabel: string;
}[] = [
  { value: "all", label: "All Domains", shortLabel: "All" },
  { value: "pv", label: "Drug Safety (PV)", shortLabel: "PV" },
  { value: "av", label: "AI Safety (AV)", shortLabel: "AV" },
  { value: "ap", label: "Infrastructure (AP)", shortLabel: "AP" },
];

interface DomainSelectorProps {
  value: DomainFilter;
  onChange: (domain: DomainFilter) => void;
}

export function DomainSelector({ value, onChange }: DomainSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hydrate from URL or localStorage on mount
  useEffect(() => {
    const urlDomain = searchParams.get("domain") as DomainFilter | null;
    if (urlDomain && DOMAIN_OPTIONS.some((o) => o.value === urlDomain)) {
      onChange(urlDomain);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY) as DomainFilter | null;
    if (stored && DOMAIN_OPTIONS.some((o) => o.value === stored)) {
      onChange(stored);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (domain: DomainFilter) => {
      onChange(domain);
      localStorage.setItem(STORAGE_KEY, domain);
      const params = new URLSearchParams(searchParams.toString());
      if (domain === "all") {
        params.delete("domain");
      } else {
        params.set("domain", domain);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [onChange, router, searchParams],
  );

  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Vigilance domain filter"
    >
      {DOMAIN_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => handleSelect(opt.value)}
            className={[
              "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-all duration-200",
              isActive
                ? "border-cyan/60 bg-cyan/10 text-cyan"
                : "border-white/10 bg-white/[0.02] text-slate-dim/50 hover:border-white/20 hover:text-slate-dim/70",
            ].join(" ")}
          >
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { DomainFilter };
