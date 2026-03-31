'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Clock, FileQuestion, CheckCircle2 } from 'lucide-react';

interface GvpModule {
  code: string;
  title: string;
  status: 'Final' | 'Void';
}

interface AssessmentBlueprint {
  moduleCode: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  passMarkPct: number;
  format: string;
}

const MODULES: GvpModule[] = [
  { code: 'I', title: 'Pharmacovigilance systems and their quality systems', status: 'Final' },
  { code: 'II', title: 'Pharmacovigilance system master file', status: 'Final' },
  { code: 'III', title: 'Pharmacovigilance inspections', status: 'Final' },
  { code: 'IV', title: 'Pharmacovigilance audits', status: 'Final' },
  { code: 'V', title: 'Risk management systems', status: 'Final' },
  { code: 'VI', title: 'Collection, management and submission of ICSRs', status: 'Final' },
  { code: 'VII', title: 'Periodic safety update report', status: 'Final' },
  { code: 'VIII', title: 'Post-authorisation safety studies', status: 'Final' },
  { code: 'IX', title: 'Signal management', status: 'Final' },
  { code: 'X', title: 'Additional monitoring', status: 'Final' },
  { code: 'XI', title: 'Void', status: 'Void' },
  { code: 'XII', title: 'Void', status: 'Void' },
  { code: 'XIII', title: 'Void', status: 'Void' },
  { code: 'XIV', title: 'Void', status: 'Void' },
  { code: 'XV', title: 'Safety communication', status: 'Final' },
  { code: 'XVI', title: 'Risk minimisation measures', status: 'Final' },
];

function getBlueprint(m: GvpModule): AssessmentBlueprint {
  if (m.status === 'Void') {
    return { moduleCode: m.code, title: `Module ${m.code} Bridging Assessment`, questionCount: 8, durationMinutes: 12, passMarkPct: 70, format: 'Guidance Mapping' };
  }
  return { moduleCode: m.code, title: `Module ${m.code} Competency Check`, questionCount: 20, durationMinutes: 25, passMarkPct: 80, format: 'Scenario + MCQ' };
}

export function GvpAssessments() {
  const [includeVoid, setIncludeVoid] = useState(true);
  const [passedModules, setPassedModules] = useState<Set<string>>(new Set());

  const blueprints = useMemo(() => {
    return MODULES
      .filter((m) => includeVoid || m.status !== 'Void')
      .map((m) => ({ module: m, blueprint: getBlueprint(m) }));
  }, [includeVoid]);

  const passedCount = blueprints.filter(({ module }) => passedModules.has(module.code)).length;

  function togglePassed(code: string) {
    setPassedModules((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="w-5 h-5 text-cyan-400" />
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em] font-mono">
            Academy Assessment Grid
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
        </div>
        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
          EMA GVP Module Assessments
        </h1>
        <p className="mt-2 text-slate-400 max-w-4xl text-sm leading-relaxed">
          Assessment blueprints for all EMA GVP modules. Final modules use scenario-based
          competency checks; void modules use guidance-mapping bridge checks.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/nucleus/academy/gvp-modules" className="border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] text-cyan-300 hover:text-cyan-200 transition-colors font-mono uppercase tracking-widest">
            Module Catalog
          </Link>
          <Link href="/nucleus/academy/gvp-curriculum" className="border border-slate-700 px-3 py-1 text-[10px] text-slate-300 hover:text-white transition-colors font-mono uppercase tracking-widest">
            Curriculum
          </Link>
          <Link href="/nucleus/academy/gvp-progress" className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-300 hover:text-emerald-200 transition-colors font-mono uppercase tracking-widest">
            Progress
          </Link>
          <label className="ml-2 inline-flex items-center gap-2 text-[10px] font-bold text-slate-300 font-mono uppercase tracking-widest cursor-pointer">
            <input
              type="checkbox"
              checked={includeVoid}
              onChange={(e) => setIncludeVoid(e.target.checked)}
              className="h-4 w-4 border-slate-700 bg-slate-900 text-cyan-500 accent-cyan-500"
            />
            Include Void
          </label>
          <span className="border border-slate-700 bg-slate-900/50 px-3 py-1 text-[10px] text-slate-300 font-mono">
            {blueprints.length} assessments
          </span>
          <span className="border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-300 font-mono">
            {passedCount} passed
          </span>
        </div>
      </header>

      {/* Assessment grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {blueprints.map(({ module, blueprint }) => {
          const passed = passedModules.has(module.code);
          return (
            <div
              key={module.code}
              className={`border p-5 transition-all ${
                passed
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Module {module.code}
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-white">{blueprint.title}</h3>
                </div>
                <button
                  onClick={() => togglePassed(module.code)}
                  className={`flex-shrink-0 p-1 transition-colors ${
                    passed ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                  }`}
                  title={passed ? 'Mark as not passed' : 'Mark as passed'}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">{module.title}</p>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-950 border border-slate-800 p-2 text-center">
                  <FileQuestion className="w-3.5 h-3.5 text-slate-500 mx-auto mb-0.5" />
                  <p className="text-[9px] text-slate-600 font-mono uppercase">Questions</p>
                  <p className="text-sm font-black text-white font-mono">{blueprint.questionCount}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-2 text-center">
                  <Clock className="w-3.5 h-3.5 text-slate-500 mx-auto mb-0.5" />
                  <p className="text-[9px] text-slate-600 font-mono uppercase">Duration</p>
                  <p className="text-sm font-black text-white font-mono">{blueprint.durationMinutes}m</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-2 text-center">
                  <ClipboardCheck className="w-3.5 h-3.5 text-slate-500 mx-auto mb-0.5" />
                  <p className="text-[9px] text-slate-600 font-mono uppercase">Pass Mark</p>
                  <p className="text-sm font-black text-white font-mono">{blueprint.passMarkPct}%</p>
                </div>
              </div>

              <span className={`inline-block px-2 py-0.5 border text-[8px] font-bold font-mono uppercase ${
                module.status === 'Final'
                  ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>
                {blueprint.format}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
