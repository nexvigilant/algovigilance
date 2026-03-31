'use client';

import { useState } from 'react';
import { Handshake, CheckCircle2, ArrowRight } from 'lucide-react';

type Tab = 'consulting' | 'templates' | 'programs';

interface Service {
  title: string;
  tier: 'Enterprise' | 'Professional' | 'Standard';
  desc: string;
  features: string[];
}

interface Template {
  title: string;
  category: 'Detection' | 'Compliance' | 'Reporting' | 'Risk';
  desc: string;
}

interface Program {
  title: string;
  duration: string;
  status: 'Available' | 'Waitlist';
  desc: string;
  deliverables: string[];
}

const SERVICES: Service[] = [
  { title: 'Regulatory Consulting', tier: 'Enterprise', desc: 'Expert guidance on FDA/EMA/ICH regulatory strategy, submissions, and compliance. Covers 21 CFR 312/314, GVP modules, and CIOMS frameworks.', features: ['Regulatory strategy development', 'Submission support (IND/NDA/BLA)', 'Compliance gap analysis', 'Inspection readiness'] },
  { title: 'Drug Safety Program Design', tier: 'Professional', desc: 'End-to-end pharmacovigilance system design from signal detection to periodic reporting.', features: ['QPPV/PV system setup', 'Signal management SOPs', 'ICSR processing workflows', 'Aggregate report strategy'] },
  { title: 'Clinical Trial Safety', tier: 'Professional', desc: 'Safety monitoring and reporting support for clinical development programs.', features: ['DSUR preparation', 'SUSAR reporting', 'DSMB support', 'Safety database design'] },
  { title: 'Quality Management', tier: 'Standard', desc: 'Quality system implementation aligned with ICH Q10 and FDA expectations.', features: ['QMS implementation', 'CAPA management', 'Training programs', 'Audit preparation'] },
  { title: 'Technology Advisory', tier: 'Enterprise', desc: 'Safety database selection, AI/ML signal detection, and automation strategy.', features: ['Database evaluation', 'AI signal detection', 'Automation roadmap', 'Data migration planning'] },
  { title: 'Risk Management', tier: 'Professional', desc: 'Benefit-risk assessment, RMP development, and REMS program support.', features: ['Benefit-risk frameworks', 'EU RMP authoring', 'REMS design', 'Risk minimization measures'] },
];

const TEMPLATES: Template[] = [
  { title: 'Signal Detection Workflow', category: 'Detection', desc: 'Complete PRR/ROR/IC/EBGM analysis pipeline with configurable thresholds and automated report generation.' },
  { title: 'ICSR Processing SOP', category: 'Compliance', desc: 'Standard operating procedure for individual case safety report intake, triage, coding, assessment, and submission.' },
  { title: 'PBRER Template', category: 'Reporting', desc: 'Periodic benefit-risk evaluation report structure per ICH E2C(R2) with all required sections.' },
  { title: 'Risk Management Plan', category: 'Risk', desc: 'EU RMP template with safety specification, PV plan, and risk minimization measures.' },
  { title: 'DSUR Template', category: 'Reporting', desc: 'Development Safety Update Report per ICH E2F for clinical-stage products.' },
  { title: 'Aggregate Report Scheduler', category: 'Compliance', desc: 'Automated tracking of PSUR/PBRER/DSUR submission deadlines across multiple products.' },
  { title: 'MedDRA Coding Guide', category: 'Detection', desc: 'Best practices for MedDRA term selection, SMQ use, and coding consistency.' },
  { title: 'Causality Assessment', category: 'Detection', desc: 'Structured Naranjo and WHO-UMC causality assessment templates with decision trees.' },
  { title: 'CAPA Management', category: 'Compliance', desc: 'Corrective and Preventive Action tracking template with root cause analysis framework.' },
];

const PROGRAMS: Program[] = [
  { title: 'PV System Startup Package', duration: '8-12 weeks', status: 'Available', desc: 'Complete pharmacovigilance system implementation for startups and emerging biotech companies.', deliverables: ['QPPV designation and support', 'PV System Master File (PSMF)', 'Core SOPs (12 procedures)', 'Safety database configuration', 'Staff training program', 'Regulatory authority notification'] },
  { title: 'Signal Management Excellence', duration: '6 weeks', status: 'Available', desc: 'Advanced signal detection and evaluation program using quantitative methods and AI-assisted analysis.', deliverables: ['Signal detection SOP and work instructions', 'PRR/ROR/IC/EBGM threshold configuration', 'Signal evaluation committee charter', 'Automated FAERS data mining setup', 'Signal tracking database', 'Regulatory communication templates'] },
  { title: 'Inspection Readiness Program', duration: '4-6 weeks', status: 'Available', desc: 'Comprehensive audit preparation covering FDA, EMA, and MHRA inspection requirements.', deliverables: ['Gap analysis against regulatory expectations', 'Document inventory and remediation plan', 'Mock inspection with findings report', 'Back room preparation guide', 'Staff interview coaching', 'CAPA tracking for identified gaps'] },
];

const TIER_COLORS: Record<string, string> = {
  Enterprise: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Professional: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Standard: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const CAT_COLORS: Record<string, string> = {
  Detection: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Compliance: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Reporting: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Risk: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'consulting', label: 'Consulting Services' },
  { key: 'templates', label: 'Workflow Templates' },
  { key: 'programs', label: 'Safety Programs' },
];

export function SolutionsHub() {
  const [activeTab, setActiveTab] = useState<Tab>('consulting');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Handshake className="w-5 h-5 text-cyan-400" />
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
        </div>
        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
          Solutions
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Professional pharmaceutical consulting, workflow templates, and safety programs
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active Engagements', value: '12', color: 'text-cyan-400' },
          { label: 'Templates Available', value: '24', color: 'text-violet-400' },
          { label: 'Expert Consultants', value: '8', color: 'text-amber-400' },
          { label: 'Programs Delivered', value: '47', color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">{s.label}</p>
            <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest transition-all ${
              activeTab === t.key
                ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                : 'bg-slate-800 border border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'consulting' && (
        <div className="grid gap-4 md:grid-cols-2">
          {SERVICES.map((s) => (
            <div key={s.title} className="border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <span className={`px-2.5 py-0.5 border text-[9px] font-bold font-mono uppercase flex-shrink-0 ${TIER_COLORS[s.tier] ?? ''}`}>
                  {s.tier}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-4">{s.desc}</p>
              <ul className="space-y-1.5">
                {s.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <div key={t.title} className="border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors cursor-pointer">
              <span className={`inline-block px-2.5 py-0.5 border text-[9px] font-bold font-mono uppercase mb-2 ${CAT_COLORS[t.category] ?? ''}`}>
                {t.category}
              </span>
              <h3 className="text-sm font-bold text-white mb-1">{t.title}</h3>
              <p className="text-[11px] text-slate-400">{t.desc}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'programs' && (
        <div className="space-y-4">
          {PROGRAMS.map((p) => (
            <div key={p.title} className="border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{p.title}</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Duration: {p.duration}</p>
                </div>
                <span className={`px-2.5 py-0.5 border text-[9px] font-bold font-mono uppercase flex-shrink-0 ${
                  p.status === 'Available' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                }`}>
                  {p.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-4">{p.desc}</p>
              <p className="text-[10px] font-bold text-slate-300 mb-2 font-mono uppercase tracking-widest">Deliverables</p>
              <div className="grid gap-1.5 md:grid-cols-2">
                {p.deliverables.map((d) => (
                  <div key={d} className="flex items-center gap-2 text-[11px] text-slate-400">
                    <ArrowRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
