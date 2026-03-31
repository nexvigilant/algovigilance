"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  BookOpen,
  Activity,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlatformSectionId } from "@/config/site-navigation";

interface TryToolScreenProps {
  chosenPath: PlatformSectionId;
  destination: string;
  onContinueToSetup: () => void;
  onGoToDestination: () => void;
}

const PATH_TRIALS: Record<
  string,
  {
    title: string;
    subtitle: string;
    placeholder: string;
    icon: LucideIcon;
    actionLabel: string;
    tryUrl: string;
  }
> = {
  learn: {
    title: "Your first lesson is waiting",
    subtitle:
      "The Academy teaches PV through guided courses with spaced repetition. Start with the fundamentals.",
    placeholder: "e.g., signal detection, causality assessment",
    icon: BookOpen,
    actionLabel: "Browse Academy Courses",
    tryUrl: "/nucleus/academy/courses",
  },
  work: {
    title: "Search any drug for safety signals",
    subtitle:
      "Type a drug name below. We'll search FDA FAERS (20M+ reports) and show you real adverse event data.",
    placeholder: "e.g., metformin, semaglutide, lisinopril",
    icon: Activity,
    actionLabel: "Open Drug Safety Search",
    tryUrl: "/nucleus/vigilance/drug-safety",
  },
  grow: {
    title: "Find your people",
    subtitle:
      "The Community connects PV professionals across specialties. Discover circles that match your interests.",
    placeholder: "e.g., oncology PV, signal detection, regulatory",
    icon: Users,
    actionLabel: "Explore Community Circles",
    tryUrl: "/nucleus/community/discover",
  },
};

export function TryToolScreen({
  chosenPath,
  destination,
  onContinueToSetup,
  onGoToDestination,
}: TryToolScreenProps) {
  const trial = PATH_TRIALS[chosenPath] ?? PATH_TRIALS.work;
  const Icon = trial.icon;
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-nex-deep flex flex-col items-center justify-center p-6">
      <div className="mx-auto max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex rounded-lg bg-cyan/10 p-3 mb-4">
            <Icon className="h-8 w-8 text-cyan" />
          </div>
          <h2 className="text-3xl font-bold font-headline text-white mb-3">
            {trial.title}
          </h2>
          <p className="text-slate-dim leading-relaxed">{trial.subtitle}</p>
        </div>

        {/* Interactive trial area */}
        <div className="rounded-xl border border-nex-light bg-nex-surface/50 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={trial.placeholder}
              className="pl-10 bg-nex-dark border-nex-light text-white placeholder:text-slate-dim/50"
            />
          </div>

          <Link
            href={
              query.trim()
                ? `${trial.tryUrl}?q=${encodeURIComponent(query.trim())}`
                : trial.tryUrl
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan/50 bg-cyan/10 px-4 py-3 text-sm font-medium text-cyan transition-all hover:bg-cyan/20 hover:border-cyan"
          >
            {trial.actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Continue options */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onContinueToSetup}
            variant="outline"
            className="w-full border-nex-light text-slate-light hover:bg-nex-surface"
          >
            Complete my profile first
          </Button>
          <button
            onClick={onGoToDestination}
            className="text-sm text-slate-dim hover:text-slate-light transition-colors text-center"
          >
            Skip everything — go to{" "}
            {chosenPath === "learn"
              ? "Academy"
              : chosenPath === "grow"
                ? "Community"
                : "Vigilance"}
          </button>
        </div>
      </div>
    </div>
  );
}
