"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Target,
  Layers,
  CheckCircle2,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AcademyProgram, ProgramResource } from "@/types/academy-program";
import { PROGRAM_TYPE_LABELS } from "@/types/academy-program";
import { ModuleCard } from "./module-card";
import { ResourcesPanel } from "./resources-panel";
import {
  groupModulesByWeek,
  weekEntrustmentLevel,
  LEVEL_COLORS,
  LEVEL_LABELS,
  QuickStat,
} from "./entrustment-helpers";

interface ProgramDetailClientProps {
  program: AcademyProgram;
  resources?: ProgramResource[];
}

export function ProgramDetailClient({
  program,
  resources = [],
}: ProgramDetailClientProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());
  const weekRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const weekGroups = useMemo(
    () => groupModulesByWeek(program.modules),
    [program.modules],
  );

  const totalActivities = program.modules.reduce(
    (sum, m) => sum + m.activities.length,
    0,
  );

  const totalHours = program.modules.reduce(
    (sum, m) => sum + m.estimatedHours,
    0,
  );

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  function toggleWeek(weekKey: string) {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  }

  function expandAll() {
    setExpandedModules(new Set(program.modules.map((m) => m.id)));
    setCollapsedWeeks(new Set());
  }

  function collapseAll() {
    setExpandedModules(new Set());
    setCollapsedWeeks(new Set(weekGroups.map((g) => g.key)));
  }

  function scrollToWeek(weekKey: string) {
    // Uncollapse the week first
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      next.delete(weekKey);
      return next;
    });
    setTimeout(() => {
      weekRefs.current[weekKey]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        href="/nucleus/academy/programs"
        className="inline-flex items-center gap-2 text-sm text-slate-light hover:text-cyan transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Programs
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-cyan/40 text-cyan">
            {PROGRAM_TYPE_LABELS[program.type]}
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-light/40 text-slate-light"
          >
            v{program.version}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          {program.name}
        </h1>
        <p className="text-lg text-slate-light max-w-3xl">
          {program.description}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <QuickStat
          icon={Clock}
          label="Duration"
          value={`${program.totalWeeks} weeks`}
        />
        <QuickStat
          icon={Calendar}
          label="Modules"
          value={String(program.modules.length)}
        />
        <QuickStat
          icon={BookOpen}
          label="Activities"
          value={String(totalActivities)}
        />
        <QuickStat
          icon={Target}
          label="EPAs"
          value={String(program.coveredEPAIds.length)}
        />
        <QuickStat
          icon={Layers}
          label="Total Hours"
          value={String(totalHours)}
        />
      </div>

      {/* Entrustment Progression Bar */}
      {weekGroups.length > 2 && (
        <section className="rounded-xl border border-nex-border bg-nex-surface/30 p-4">
          <h3 className="text-xs font-medium text-slate-light/60 uppercase tracking-wider mb-3">
            Entrustment Progression
          </h3>
          <div className="flex gap-1">
            {weekGroups.map((group) => {
              const level = weekEntrustmentLevel(group.modules);
              const hours = group.modules.reduce(
                (s, m) => s + m.estimatedHours,
                0,
              );
              return (
                <button
                  key={group.key}
                  onClick={() => scrollToWeek(group.key)}
                  className="flex-1 group relative"
                  aria-label={`Jump to ${group.label}`}
                >
                  <div
                    className={`h-3 rounded-sm ${LEVEL_COLORS[level]} opacity-80 group-hover:opacity-100 transition-opacity`}
                  />
                  <div className="mt-1.5 text-center">
                    <div className="text-[10px] font-medium text-slate-light/70 group-hover:text-white transition-colors">
                      {group.label}
                    </div>
                    <div className="text-[9px] text-slate-light/40">
                      {hours}h · {LEVEL_LABELS[level]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Philosophy */}
      <section className="rounded-xl border border-nex-border bg-nex-surface/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-3">
          Program Philosophy
        </h2>
        <p className="text-slate-light leading-relaxed">{program.philosophy}</p>
      </section>

      {/* Goals */}
      <section className="rounded-xl border border-nex-border bg-nex-surface/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Program Goals</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {program.goals.map((goal, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-cyan mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-light">{goal}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Module Pathway (grouped by week) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Module Pathway</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              aria-label="Expand all modules"
              className="text-slate-light hover:text-white"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              aria-label="Collapse all modules"
              className="text-slate-light hover:text-white"
            >
              Collapse All
            </Button>
          </div>
        </div>

        {/* Entrustment Legend */}
        <div className="mb-6 flex flex-wrap gap-3">
          {Object.entries(LEVEL_LABELS)
            .filter(([k]) => k !== "L5")
            .map(([level, label]) => (
              <span
                key={level}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border border-nex-border"
              >
                <span
                  className={`h-2 w-2 rounded-full ${LEVEL_COLORS[level]}`}
                />
                <span className="text-slate-light">
                  {level} · {label}
                </span>
              </span>
            ))}
        </div>

        {/* Week Groups */}
        <div className="space-y-6">
          {weekGroups.map((group) => {
            const isCollapsed = collapsedWeeks.has(group.key);
            const level = weekEntrustmentLevel(group.modules);
            const weekHours = group.modules.reduce(
              (s, m) => s + m.estimatedHours,
              0,
            );
            const weekActivities = group.modules.reduce(
              (s, m) => s + m.activities.length,
              0,
            );

            return (
              <div
                key={group.key}
                ref={(el) => {
                  weekRefs.current[group.key] = el;
                }}
              >
                {/* Week Header */}
                <button
                  onClick={() => toggleWeek(group.key)}
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${group.label}`}
                  className="w-full flex items-center gap-3 mb-3 group"
                >
                  <div
                    className={`h-8 w-1 rounded-full ${LEVEL_COLORS[level]}`}
                  />
                  <h3 className="text-base font-semibold text-white group-hover:text-cyan transition-colors">
                    {group.label}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-light/50">
                    <span>{group.modules.length} days</span>
                    <span>{weekHours}h</span>
                    <span>{weekActivities} activities</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        level === "L1"
                          ? "border-slate-light/20 text-slate-light/60"
                          : level === "L2"
                            ? "border-blue-400/30 text-blue-400/80"
                            : level === "L3"
                              ? "border-amber-400/30 text-amber-400/80"
                              : "border-emerald-400/30 text-emerald-400/80"
                      }`}
                    >
                      {level} · {LEVEL_LABELS[level]}
                    </Badge>
                  </div>
                  <div className="ml-auto">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-slate-light/40" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-light/40" />
                    )}
                  </div>
                </button>

                {/* Module Cards within week */}
                {!isCollapsed && (
                  <div className="space-y-2 ml-4 border-l border-nex-border/50 pl-4">
                    {group.modules.map((mod, idx) => (
                      <ModuleCard
                        key={mod.id}
                        module={mod}
                        isExpanded={expandedModules.has(mod.id)}
                        onToggle={() => toggleModule(mod.id)}
                        isLast={idx === group.modules.length - 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Success Metrics */}
      <section className="rounded-xl border border-nex-border bg-nex-surface/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan" />
          Success Metrics
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {program.metrics.map((metric, i) => (
            <div
              key={i}
              className="rounded-lg border border-nex-border/50 bg-nex-bg/50 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-white">
                  {metric.name}
                </h3>
                <Badge
                  variant="outline"
                  className={
                    metric.category === "student_outcomes"
                      ? "border-cyan/30 text-cyan text-[10px]"
                      : metric.category === "program_effectiveness"
                        ? "border-amber-400/30 text-amber-400 text-[10px]"
                        : "border-slate-light/30 text-slate-light text-[10px]"
                  }
                >
                  {metric.category.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-xs text-slate-light mb-2">
                {metric.description}
              </p>
              <div className="text-xs">
                <span className="text-slate-light/60">Target: </span>
                <span className="font-mono text-emerald-400">
                  {metric.target}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Admission */}
      <section className="rounded-xl border border-nex-border bg-nex-surface/30 p-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan" />
          Who This Is For
        </h2>
        <p className="text-sm text-slate-light mb-4">
          {program.targetAudience}
        </p>
        <h3 className="text-sm font-medium text-white mb-2">Prerequisites</h3>
        <ul className="space-y-2">
          {program.admissionPrerequisites.map((prereq, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-slate-light"
            >
              <span className="text-cyan mt-1">•</span>
              {prereq}
            </li>
          ))}
        </ul>
      </section>

      {/* Community Circle */}
      {program.type === "appe" && (
        <section className="rounded-xl border border-cyan/20 bg-cyan/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan" />
                Cohort Circle
              </h2>
              <p className="text-sm text-slate-light">
                Join the APPE PV Rotation community — collaborate with fellow
                students, share case studies, discuss literature, and build your
                professional network.
              </p>
            </div>
            <Link
              href="/nucleus/community/circles/academy"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan/10 border border-cyan/30 px-4 py-2 text-sm font-medium text-cyan hover:bg-cyan/20 transition-colors flex-shrink-0"
            >
              Join Circle
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              "General Discussion",
              "Case Study Workshop",
              "Journal Club",
              "Career & Networking",
              "Study Resources",
              "Preceptor Corner",
            ].map((space) => (
              <span
                key={space}
                className="text-[11px] text-slate-light/50 bg-nex-surface/30 rounded-full px-2.5 py-0.5"
              >
                {space}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Preceptor Resources */}
      {resources.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cyan" />
            Program Resources ({resources.length} guides)
          </h2>
          <ResourcesPanel resources={resources} />
        </section>
      )}
    </div>
  );
}
