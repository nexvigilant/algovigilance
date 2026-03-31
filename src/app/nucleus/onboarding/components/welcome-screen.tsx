"use client";

import {
  BookOpen,
  Activity,
  Users,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { PlatformSectionId } from "@/config/site-navigation";

interface PathOption {
  id: PlatformSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  destination: string;
  trialAction: string;
}

const PATHS: PathOption[] = [
  {
    id: "learn",
    label: "Learn",
    description:
      "Build PV skills through courses, interactive labs, and 3D visualizations.",
    icon: BookOpen,
    destination: "/nucleus/academy",
    trialAction: "Start your first lesson",
  },
  {
    id: "work",
    label: "Work",
    description:
      "Investigate drug safety signals with live FAERS data, causality tools, and reporting.",
    icon: Activity,
    destination: "/nucleus/vigilance",
    trialAction: "Run a drug safety search",
  },
  {
    id: "grow",
    label: "Grow",
    description:
      "Connect with PV professionals, join circles, and build your career portfolio.",
    icon: Users,
    destination: "/nucleus/community",
    trialAction: "Find your community",
  },
];

interface WelcomeScreenProps {
  userName: string;
  onSelectPath: (path: PlatformSectionId, destination: string) => void;
  onSkip: () => void;
}

export function WelcomeScreen({
  userName,
  onSelectPath,
  onSkip,
}: WelcomeScreenProps) {
  const firstName = userName.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-nex-deep flex flex-col items-center justify-center p-6">
      <div className="mx-auto max-w-2xl text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-4 py-1.5 text-sm text-cyan mb-6">
          <Sparkles className="h-4 w-4" />
          Welcome to AlgoVigilance
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-white mb-4">
          Hey {firstName}, what brings you here?
        </h1>
        <p className="text-lg text-slate-dim max-w-lg mx-auto">
          Pick the path that fits. You can explore everything later — this just
          helps us show you the right things first.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-8">
        {PATHS.map((path) => {
          const Icon = path.icon;
          return (
            <button
              key={path.id}
              onClick={() => onSelectPath(path.id, path.destination)}
              className="group relative flex flex-col items-start gap-4 rounded-xl border border-nex-light bg-nex-surface/50 p-6 text-left transition-all hover:border-cyan/50 hover:bg-cyan/5 hover:shadow-lg hover:shadow-cyan/5 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-nex-deep"
            >
              <div className="rounded-lg bg-cyan/10 p-2.5">
                <Icon className="h-6 w-6 text-cyan" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan transition-colors">
                  {path.label}
                </h3>
                <p className="text-sm text-slate-dim mt-1 leading-relaxed">
                  {path.description}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-cyan/70 group-hover:text-cyan transition-colors mt-auto">
                {path.trialAction}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onSkip}
        className="text-sm text-slate-dim hover:text-slate-light transition-colors"
      >
        Skip — take me to the full setup
      </button>
    </div>
  );
}
