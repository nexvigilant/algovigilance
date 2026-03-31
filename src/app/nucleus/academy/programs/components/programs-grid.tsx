"use client";

import Link from "next/link";
import {
  GraduationCap,
  Clock,
  Layers,
  Target,
  Users,
  ArrowRight,
} from "lucide-react";
import type { ProgramCatalogCard } from "@/types/academy-program";
import { PROGRAM_TYPE_LABELS } from "@/types/academy-program";

interface ProgramsGridProps {
  programs: ProgramCatalogCard[];
}

export function ProgramsGrid({ programs }: ProgramsGridProps) {
  if (programs.length === 0) {
    return (
      <div className="mt-12 text-center py-16">
        <GraduationCap className="mx-auto h-12 w-12 text-slate-light/50" />
        <p className="mt-4 text-slate-light">
          No programs available yet. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  );
}

function ProgramCard({ program }: { program: ProgramCatalogCard }) {
  return (
    <Link
      href={`/nucleus/academy/programs/${program.id}`}
      className="group relative flex flex-col rounded-xl border border-nex-border bg-nex-surface/50 p-6 transition-all hover:border-cyan/40 hover:bg-nex-surface"
    >
      {/* Type Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center rounded-full bg-cyan/10 px-3 py-1 text-xs font-medium text-cyan">
          {PROGRAM_TYPE_LABELS[program.type]}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-semibold text-white group-hover:text-cyan transition-colors">
        {program.name}
      </h3>
      <p className="mt-2 text-sm text-slate-light line-clamp-3 flex-1">
        {program.description}
      </p>

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-nex-border pt-4">
        <StatItem
          icon={Clock}
          label="Duration"
          value={`${program.totalWeeks} weeks`}
        />
        <StatItem
          icon={Layers}
          label="Modules"
          value={String(program.moduleCount)}
        />
        <StatItem
          icon={Target}
          label="EPAs"
          value={String(program.coveredEPACount)}
        />
        <StatItem
          icon={Users}
          label="Hours"
          value={String(program.totalEstimatedHours)}
        />
      </div>

      {/* CTA */}
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-cyan opacity-0 group-hover:opacity-100 transition-opacity">
        View Program
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-slate-light/60" />
      <div>
        <div className="text-xs text-slate-light/60">{label}</div>
        <div className="text-sm font-mono text-white">{value}</div>
      </div>
    </div>
  );
}
