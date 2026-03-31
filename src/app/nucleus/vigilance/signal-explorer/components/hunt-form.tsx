"use client";

import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TipBox } from "@/components/pv-for-nexvigilants";
import type { ContingencyTable } from "@/lib/pv-compute";

interface HuntFormProps {
  onHunt: (drug: string) => void;
  loading: boolean;
  /** Optional pre-filled contingency table for direct signal entry (bypasses FAERS lookup). */
  initialTable?: ContingencyTable;
}

const DEMO_DRUGS = ["dexlansoprazole", "vonoprazan"];

export function HuntForm({ onHunt, loading }: HuntFormProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onHunt(trimmed.toLowerCase());
  }

  return (
    <div className="space-y-4">
      <TipBox>
        Type a drug name and press Hunt. We&apos;ll cross-reference the
        FDA&apos;s 20 million adverse event reports against the drug&apos;s
        label — and surface every serious event that shouldn&apos;t be there.
      </TipBox>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder="e.g. dexlansoprazole, vonoprazan, omeprazole..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="pl-9"
            aria-label="Drug name"
            disabled={loading}
          />
        </div>
        <Button type="submit" disabled={loading || !value.trim()}>
          {loading ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Hunting...
            </>
          ) : (
            "Hunt"
          )}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">Try a demo:</span>
        {DEMO_DRUGS.map((drug) => (
          <button
            key={drug}
            type="button"
            onClick={() => {
              setValue(drug);
              onHunt(drug);
            }}
            disabled={loading}
            className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground disabled:opacity-50"
          >
            {drug}
          </button>
        ))}
      </div>
    </div>
  );
}
