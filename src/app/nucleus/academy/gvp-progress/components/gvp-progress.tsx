'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { BarChart3, CheckCircle2, Circle, Clock } from 'lucide-react';

interface GvpModule {
  code: string;
  title: string;
  status: 'Final' | 'Void';
  pathway: string;
  lessonCount: number;
  totalMinutes: number;
}

type ModuleProgress = 'not-started' | 'in-progress' | 'completed';

const MODULES: GvpModule[] = [
  { code: 'I', title: 'PV systems and quality systems', status: 'Final', pathway: 'PV Governance Foundations', lessonCount: 4, totalMinutes: 160 },
  { code: 'II', title: 'PV system master file', status: 'Final', pathway: 'PV Governance Foundations', lessonCount: 4, totalMinutes: 160 },
  { code: 'III', title: 'PV inspections', status: 'Final', pathway: 'Inspection Readiness', lessonCount: 4, totalMinutes: 160 },
  { code: 'IV', title: 'PV audits', status: 'Final', pathway: 'Inspection Readiness', lessonCount: 4, totalMinutes: 160 },
  { code: 'V', title: 'Risk management systems', status: 'Final', pathway: 'Risk & Benefit Management', lessonCount: 4, totalMinutes: 160 },
  { code: 'VI', title: 'Collection and submission of ICSRs', status: 'Final', pathway: 'Case Processing Excellence', lessonCount: 4, totalMinutes: 160 },
  { code: 'VII', title: 'Periodic safety update report', status: 'Final', pathway: 'Regulatory Reporting', lessonCount: 4, totalMinutes: 160 },
  { code: 'VIII', title: 'Post-authorisation safety studies', status: 'Final', pathway: 'Evidence & Studies', lessonCount: 4, totalMinutes: 160 },
  { code: 'IX', title: 'Signal management', status: 'Final', pathway: 'Signal Intelligence', lessonCount: 4, totalMinutes: 160 },
  { code: 'X', title: 'Additional monitoring', status: 'Final', pathway: 'Signal Intelligence', lessonCount: 4, totalMinutes: 160 },
  { code: 'XI', title: 'Void', status: 'Void', pathway: 'Reserved', lessonCount: 1, totalMinutes: 20 },
  { code: 'XII', title: 'Void', status: 'Void', pathway: 'Reserved', lessonCount: 1, totalMinutes: 20 },
  { code: 'XIII', title: 'Void', status: 'Void', pathway: 'Reserved', lessonCount: 1, totalMinutes: 20 },
  { code: 'XIV', title: 'Void', status: 'Void', pathway: 'Reserved', lessonCount: 1, totalMinutes: 20 },
  { code: 'XV', title: 'Safety communication', status: 'Final', pathway: 'Stakeholder Communication', lessonCount: 4, totalMinutes: 160 },
  { code: 'XVI', title: 'Risk minimisation measures', status: 'Final', pathway: 'Risk & Benefit Management', lessonCount: 4, totalMinutes: 160 },
];

const STATUS_CONFIG: Record<ModuleProgress, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  'not-started': { label: 'Not Started', color: 'text-slate-500', icon: Circle },
  'in-progress': { label: 'In Progress', color: 'text-amber-400', icon: Clock },
  completed: { label: 'Completed', color: 'text-emerald-400', icon: CheckCircle2 },
};

const PROGRESS_CYCLE: ModuleProgress[] = ['not-started', 'in-progress', 'completed'];

export function GvpProgress() {
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>(() => {
    const initial: Record<string, ModuleProgress> = {};
    MODULES.forEach((m) => { initial[m.code] = 'not-started'; });
    return initial;
  });

  const cycleProgress = useCallback((code: string) => {
    setProgress((prev) => {
      const current = prev[code] ?? 'not-started';
      const idx = PROGRESS_CYCLE.indexOf(current);
      const next = PROGRESS_CYCLE[(idx + 1) % PROGRESS_CYCLE.length];
      return { ...prev, [code]: next };
    });
  }, []);

  const stats = useMemo(() => {
    const values = Object.values(progress);
    return {
      completed: values.filter((v) => v === 'completed').length,
      inProgress: values.filter((v) => v === 'in-progress').length,
      notStarted: values.filter((v) => v === 'not-started').length,
      total: values.length,
    };
  }, [progress]);

  const completionPct = Math.round((stats.completed / stats.total) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em] font-mono">
            Progress Tracker
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
        </div>
        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
          GVP Module Progress
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Track your progress through the EMA GVP learning track. Click status to cycle through stages.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/nucleus/academy/gvp-modules" className="border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] text-cyan-300 hover:text-cyan-200 transition-colors font-mono uppercase tracking-widest">
            Module Catalog
          </Link>
          <Link href="/nucleus/academy/gvp-curriculum" className="border border-slate-700 px-3 py-1 text-[10px] text-slate-300 hover:text-white transition-colors font-mono uppercase tracking-widest">
            Curriculum
          </Link>
          <Link href="/nucleus/academy/gvp-assessments" className="border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] text-amber-300 hover:text-amber-200 transition-colors font-mono uppercase tracking-widest">
            Assessments
          </Link>
        </div>
      </header>

      {/* Progress overview */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="border border-slate-800 bg-slate-900/50 p-4 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">Completion</p>
          <p className="text-2xl font-black text-white font-mono">{completionPct}%</p>
        </div>
        <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">Completed</p>
          <p className="text-2xl font-black text-emerald-400 font-mono">{stats.completed}</p>
        </div>
        <div className="border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">In Progress</p>
          <p className="text-2xl font-black text-amber-400 font-mono">{stats.inProgress}</p>
        </div>
        <div className="border border-slate-800 bg-slate-900/50 p-4 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">Not Started</p>
          <p className="text-2xl font-black text-slate-400 font-mono">{stats.notStarted}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-800 mb-8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${completionPct}%` }}
        />
      </div>

      {/* Module list */}
      <div className="space-y-2">
        {MODULES.map((m) => {
          const status = progress[m.code] ?? 'not-started';
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <div
              key={m.code}
              className={`border p-4 flex items-center gap-4 transition-all ${
                status === 'completed'
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : status === 'in-progress'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              {/* Status toggle */}
              <button
                onClick={() => cycleProgress(m.code)}
                className={`flex-shrink-0 ${config.color} hover:opacity-80 transition-opacity`}
                title={`Status: ${config.label}. Click to change.`}
              >
                <Icon className="w-5 h-5" />
              </button>

              {/* Module code */}
              <span className="text-[10px] font-black text-slate-500 font-mono w-8 flex-shrink-0">
                {m.code}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{m.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-slate-500 font-mono">{m.pathway}</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-[9px] text-slate-500 font-mono">{m.lessonCount} lessons</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-[9px] text-slate-500 font-mono">{m.totalMinutes} min</span>
                </div>
              </div>

              {/* Status badge */}
              <span className={`flex-shrink-0 px-2 py-0.5 border text-[8px] font-bold font-mono uppercase ${
                status === 'completed'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : status === 'in-progress'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-slate-500 bg-slate-500/10 border-slate-500/20'
              }`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
