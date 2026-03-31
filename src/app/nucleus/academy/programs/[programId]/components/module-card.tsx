"use client";

import {
  ChevronDown,
  ChevronRight,
  Target,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProgramModule } from "@/types/academy-program";
import { ASSESSMENT_METHOD_LABELS } from "@/types/academy-program";
import type { AssessmentMethod } from "@/types/academy-program";

interface ModuleCardProps {
  module: ProgramModule;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

export function ModuleCard({
  module: mod,
  isExpanded,
  onToggle,
  isLast,
}: ModuleCardProps) {
  // Map entrustment color by target level of first activity (not sequence number)
  // This handles both weekly (7 modules) and daily (32 modules) programs correctly
  const firstActivityLevel =
    mod.activities.length > 0 ? mod.activities[0].targetLevel : "L1";
  const entrustmentColor =
    firstActivityLevel === "L1"
      ? "bg-slate-light/60"
      : firstActivityLevel === "L2"
        ? "bg-blue-400"
        : firstActivityLevel === "L3"
          ? "bg-amber-400"
          : "bg-emerald-400";

  return (
    <div className="relative">
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-px bg-nex-border" />
      )}

      <div className="rounded-xl border border-nex-border bg-nex-surface/30 overflow-hidden">
        <button
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} module: ${mod.title}`}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-nex-surface/50 transition-colors"
        >
          <div
            className={`flex-shrink-0 h-10 w-10 rounded-full ${entrustmentColor}/20 border border-current flex items-center justify-center`}
            style={{ borderColor: "var(--tw-bg-opacity, 1)" }}
          >
            <span className="text-sm font-mono font-bold text-white">
              {mod.sequenceNumber === 0 ? "P" : mod.sequenceNumber}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {mod.title}
              </h3>
              <span className={`h-2 w-2 rounded-full ${entrustmentColor}`} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-slate-light/60">
              <span>{mod.scheduledWeeks}</span>
              <span>{mod.estimatedHours}h</span>
              <span>{mod.activities.length} activities</span>
              {mod.epaIds.length > 0 && <span>{mod.epaIds.length} EPAs</span>}
            </div>
          </div>

          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-slate-light/60 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-light/60 flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-nex-border px-4 pb-4">
            <p className="text-sm text-slate-light py-3">{mod.description}</p>

            {mod.learningObjectives.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-white mb-2 uppercase tracking-wider">
                  Learning Objectives
                </h4>
                <ul className="space-y-1.5">
                  {mod.learningObjectives.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-light"
                    >
                      <Target className="h-3 w-3 text-cyan mt-0.5 flex-shrink-0" />
                      {obj.statement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium text-white mb-2 uppercase tracking-wider">
                Activities
              </h4>
              <div className="space-y-2">
                {mod.activities.map((activity, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-nex-border/40 bg-nex-bg/30 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <FileText className="h-3.5 w-3.5 text-cyan/60 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-xs font-medium text-white">
                            {activity.title}
                          </h5>
                          <p className="text-[11px] text-slate-light/70 mt-0.5">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-light/50 flex-shrink-0 ml-2">
                        {activity.estimatedHours}h
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2 ml-5">
                      {activity.epaIds.map((epa) => (
                        <Badge
                          key={epa}
                          variant="outline"
                          className="text-[10px] border-cyan/20 text-cyan/80 px-1.5 py-0"
                        >
                          {epa}
                        </Badge>
                      ))}
                      {activity.assessmentMethods.map((method) => (
                        <Badge
                          key={method}
                          variant="outline"
                          className="text-[10px] border-slate-light/20 text-slate-light/60 px-1.5 py-0"
                        >
                          {ASSESSMENT_METHOD_LABELS[method as AssessmentMethod]}
                        </Badge>
                      ))}
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          activity.targetLevel === "L1"
                            ? "border-slate-light/20 text-slate-light/60"
                            : activity.targetLevel === "L2"
                              ? "border-blue-400/30 text-blue-400/80"
                              : activity.targetLevel === "L3"
                                ? "border-amber-400/30 text-amber-400/80"
                                : "border-emerald-400/30 text-emerald-400/80"
                        }`}
                      >
                        {activity.targetLevel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {mod.acpeStandards.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <GraduationCap className="h-3 w-3 text-slate-light/40" />
                <span className="text-[10px] text-slate-light/40">
                  ACPE Standards:{" "}
                  {mod.acpeStandards.map((s) => `§${s}`).join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
