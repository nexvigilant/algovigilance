'use client';

import Link from 'next/link';
import { GraduationCap, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface GvpModule {
  code: string;
  title: string;
  status: 'Final' | 'Void';
  pathway: string;
  ksbDomains: string[];
}

interface Lesson {
  title: string;
  objective: string;
  durationMinutes: number;
}

const MODULES: GvpModule[] = [
  { code: 'I', title: 'Pharmacovigilance systems and their quality systems', status: 'Final', pathway: 'PV Governance Foundations', ksbDomains: ['D01', 'D02', 'D05'] },
  { code: 'II', title: 'Pharmacovigilance system master file', status: 'Final', pathway: 'PV Governance Foundations', ksbDomains: ['D02', 'D04', 'D06'] },
  { code: 'III', title: 'Pharmacovigilance inspections', status: 'Final', pathway: 'Inspection Readiness', ksbDomains: ['D04', 'D06', 'D11'] },
  { code: 'IV', title: 'Pharmacovigilance audits', status: 'Final', pathway: 'Inspection Readiness', ksbDomains: ['D04', 'D05', 'D11'] },
  { code: 'V', title: 'Risk management systems', status: 'Final', pathway: 'Risk & Benefit Management', ksbDomains: ['D07', 'D10', 'D12'] },
  { code: 'VI', title: 'Collection, management and submission of ICSRs', status: 'Final', pathway: 'Case Processing Excellence', ksbDomains: ['D03', 'D06', 'D08'] },
  { code: 'VII', title: 'Periodic safety update report', status: 'Final', pathway: 'Regulatory Reporting', ksbDomains: ['D04', 'D09', 'D10'] },
  { code: 'VIII', title: 'Post-authorisation safety studies', status: 'Final', pathway: 'Evidence & Studies', ksbDomains: ['D09', 'D12', 'D13'] },
  { code: 'IX', title: 'Signal management', status: 'Final', pathway: 'Signal Intelligence', ksbDomains: ['D08', 'D10', 'D12'] },
  { code: 'X', title: 'Additional monitoring', status: 'Final', pathway: 'Signal Intelligence', ksbDomains: ['D08', 'D09', 'D14'] },
  { code: 'XI', title: 'Void', status: 'Void', pathway: 'Reserved', ksbDomains: ['D14'] },
  { code: 'XII', title: 'Void', status: 'Void', pathway: 'Reserved', ksbDomains: ['D14'] },
  { code: 'XIII', title: 'Void', status: 'Void', pathway: 'Reserved', ksbDomains: ['D14'] },
  { code: 'XIV', title: 'Void', status: 'Void', pathway: 'Reserved', ksbDomains: ['D14'] },
  { code: 'XV', title: 'Safety communication', status: 'Final', pathway: 'Stakeholder Communication', ksbDomains: ['D10', 'D11', 'D15'] },
  { code: 'XVI', title: 'Risk minimisation measures', status: 'Final', pathway: 'Risk & Benefit Management', ksbDomains: ['D07', 'D10', 'D15'] },
];

function generateLessons(m: GvpModule): Lesson[] {
  if (m.status === 'Void') {
    return [{ title: `Module ${m.code} Orientation`, objective: 'Understand why this module is marked void and identify linked EMA guidance.', durationMinutes: 20 }];
  }
  return [
    { title: `Module ${m.code} Foundations`, objective: `Define the scope and intent of GVP Module ${m.code} for operational PV.`, durationMinutes: 35 },
    { title: `Module ${m.code} Regulatory Requirements`, objective: 'Translate EMA expectations into SOP-level implementation controls.', durationMinutes: 45 },
    { title: `Module ${m.code} Applied Case Workshop`, objective: 'Apply requirements to a realistic post-authorisation safety scenario.', durationMinutes: 50 },
    { title: `Module ${m.code} Competency Check`, objective: 'Demonstrate evidence-backed execution against mapped KSB domains.', durationMinutes: 30 },
  ];
}

const allLessons = MODULES.map((m) => ({ module: m, lessons: generateLessons(m) }));
const totalLessons = allLessons.reduce((sum, g) => sum + g.lessons.length, 0);
const totalMinutes = allLessons.reduce((sum, g) => sum + g.lessons.reduce((s, l) => s + l.durationMinutes, 0), 0);

function ModuleSection({ module, lessons }: { module: GvpModule; lessons: Lesson[] }) {
  const [open, setOpen] = useState(module.status === 'Final');
  const totalMin = lessons.reduce((s, l) => s + l.durationMinutes, 0);

  return (
    <div className="border border-slate-800 bg-slate-900/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <span className="text-[10px] font-black text-slate-500 font-mono w-8">
            {module.code}
          </span>
          <div>
            <p className="text-sm font-bold text-white">{module.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-slate-500 font-mono">{lessons.length} lessons</span>
              <span className="text-slate-700">|</span>
              <span className="text-[9px] text-slate-500 font-mono">{totalMin} min</span>
              <span className="text-slate-700">|</span>
              <span className={`text-[9px] font-mono ${module.status === 'Final' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {module.status}
              </span>
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-slate-800 divide-y divide-slate-800/50">
          {lessons.map((l, i) => (
            <div key={i} className="px-5 py-3 pl-16">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-white font-mono">{l.title}</p>
                <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" /> {l.durationMinutes} min
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{l.objective}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GvpCurriculum() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-5 h-5 text-cyan-400" />
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em] font-mono">
            Academy Curriculum Engine
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
        </div>
        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
          EMA GVP Module Integration Matrix
        </h1>
        <p className="mt-2 text-slate-400 max-w-4xl text-sm leading-relaxed">
          Auto-generated learning blueprint mapping every EMA GVP module to Academy pathways
          and KSB domains, with generated lesson plans ready for content authoring.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="border border-slate-700 bg-slate-900/50 px-3 py-1 text-[10px] text-slate-300 font-mono">Modules: 16</span>
          <span className="border border-slate-700 bg-slate-900/50 px-3 py-1 text-[10px] text-slate-300 font-mono">Lessons: {totalLessons}</span>
          <span className="border border-slate-700 bg-slate-900/50 px-3 py-1 text-[10px] text-slate-300 font-mono">Total: {Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span>
          <Link href="/nucleus/academy/gvp-modules" className="border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] text-cyan-300 hover:text-cyan-200 transition-colors font-mono">
            Module Catalog
          </Link>
          <Link href="/nucleus/academy/gvp-assessments" className="border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] text-amber-300 hover:text-amber-200 transition-colors font-mono">
            Assessments
          </Link>
        </div>
      </header>

      {/* Curriculum list */}
      <div className="space-y-2">
        {allLessons.map(({ module, lessons }) => (
          <ModuleSection key={module.code} module={module} lessons={lessons} />
        ))}
      </div>
    </div>
  );
}
