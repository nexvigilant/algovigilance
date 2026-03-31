'use client';

import { useState, useMemo } from 'react';
import { Search, Clock, AlertTriangle } from 'lucide-react';

interface Timeline {
  reportType: string;
  category: string;
  fda: string;
  ema: string;
  ich: string;
  who: string;
  day0: string;
  differences: string;
}

const TIMELINES: Timeline[] = [
  /* === Individual Case Safety Reports (ICSRs) === */
  { reportType: 'Fatal / Life-Threatening ICSR (Expedited)', category: 'ICSR', fda: '7 calendar days (initial), 15 days (follow-up)', ema: '15 calendar days', ich: '15 calendar days (E2A)', who: 'As soon as possible, no later than 15 days', day0: 'Date MAH first becomes aware of minimum criteria', differences: 'FDA requires 7-day alert for fatal/life-threatening; EMA and ICH use 15-day standard' },
  { reportType: 'Serious, Unexpected ICSR (Expedited)', category: 'ICSR', fda: '15 calendar days', ema: '15 calendar days', ich: '15 calendar days (E2A)', who: '15 calendar days', day0: 'Date MAH first becomes aware of minimum criteria', differences: 'Harmonized across all jurisdictions for serious unexpected events' },
  { reportType: 'Serious, Expected ICSR', category: 'ICSR', fda: 'Periodic (PSUR/PBRER)', ema: '90 days (EudraVigilance)', ich: 'Periodic reporting (E2C(R2))', who: 'Periodic reporting', day0: 'Date MAH becomes aware', differences: 'FDA does not require individual expedited reporting for expected events' },
  { reportType: 'Non-Serious ICSR', category: 'ICSR', fda: 'Not individually reported to FDA', ema: '90 days (EudraVigilance)', ich: 'Not individually expedited', who: 'Not individually required', day0: 'N/A', differences: 'EMA requires all ICSRs in EudraVigilance; FDA only collects through periodic reports' },
  { reportType: 'Consumer/Patient Direct Report', category: 'ICSR', fda: '15 days if serious/unexpected', ema: '15 days (serious), 90 days (non-serious)', ich: 'Same as HCP reports (E2D)', who: 'Same standards as HCP reports', day0: 'Date MAH receives report with minimum criteria', differences: 'All jurisdictions treat consumer reports equally to HCP reports for expedited criteria' },
  { reportType: 'Literature Case Report', category: 'ICSR', fda: '15 days if serious/unexpected (from awareness)', ema: '15 days (serious), 90 days (non-serious)', ich: '15 days (E2D) from awareness', who: '15 days from awareness', day0: 'Date MAH identifies the case through systematic literature review', differences: 'All require systematic literature screening; Day 0 is date of awareness, not publication' },

  /* === Clinical Trial Reports === */
  { reportType: 'SUSAR (Clinical Trial)', category: 'Clinical Trial', fda: '7 days (fatal/life-threatening), 15 days (other serious)', ema: '7 days (fatal/life-threatening), 15 days (other serious)', ich: '7 days (fatal/life-threatening), 15 days (other serious) (E2A)', who: 'Aligned with ICH E2A', day0: 'Date sponsor first becomes aware', differences: 'Harmonized 7/15 day framework across all jurisdictions for SUSARs' },
  { reportType: 'IND Safety Report', category: 'Clinical Trial', fda: '7 days (fatal/life-threatening), 15 days (other serious unexpected)', ema: 'N/A (uses SUSAR framework)', ich: 'Covered under SUSAR (E2A/E6)', who: 'N/A', day0: 'Date sponsor becomes aware', differences: 'FDA-specific terminology; aligns with SUSAR timelines' },
  { reportType: 'Annual IND Safety Report', category: 'Clinical Trial', fda: 'Within 60 days of IND anniversary', ema: 'Annual Safety Report (ASR) per CT Regulation', ich: 'DSUR annually (E2F)', who: 'N/A', day0: 'IND anniversary date / DSUR data lock point', differences: 'FDA uses IND-specific report; EMA uses ASR; ICH recommends DSUR format for all' },
  { reportType: 'DSUR (Development Safety Update Report)', category: 'Clinical Trial', fda: 'Accepted as annual IND safety report', ema: 'Required annually', ich: 'Annually, within 60 days of DIBD (E2F)', who: 'Recommended annually', day0: 'Development International Birth Date (DIBD)', differences: 'ICH E2F format accepted globally; covers entire development program' },

  /* === Periodic Reports === */
  { reportType: 'PSUR/PBRER', category: 'Periodic', fda: 'Not required (replaced by PADER for NDA)', ema: 'Per EURD list schedule (6mo/1yr/3yr)', ich: 'Per IBD schedule (E2C(R2))', who: 'Recommended per ICH schedule', day0: 'International Birth Date (IBD) or EURD list date', differences: 'FDA does not accept PSUR/PBRER; uses PADER. EMA follows EURD list. ICH uses IBD.' },
  { reportType: 'PADER (Periodic Adverse Drug Experience Report)', category: 'Periodic', fda: 'Quarterly (Yr 1-3), then annually', ema: 'N/A (uses PBRER)', ich: 'N/A (PBRER recommended)', who: 'N/A', day0: 'US approval date', differences: 'FDA-specific format. Not used outside the US.' },
  { reportType: 'Addendum to Clinical Overview (ACO)', category: 'Periodic', fda: 'N/A', ema: 'Required with PBRER for some products', ich: 'N/A', who: 'N/A', day0: 'PBRER data lock point', differences: 'EMA-specific requirement for certain product types' },

  /* === Risk Management === */
  { reportType: 'RMP (Risk Management Plan)', category: 'Risk Management', fda: 'REMS (not RMP format)', ema: 'At time of MAA + updates per triggers', ich: 'E2E provides framework', who: 'Recommended for essential medicines', day0: 'MAA submission / significant safety trigger', differences: 'EMA requires formal RMP; FDA uses REMS; ICH E2E is non-binding guidance' },
  { reportType: 'REMS (Risk Evaluation & Mitigation Strategy)', category: 'Risk Management', fda: 'Required if benefits need additional measures; assessments at 18mo, 3yr, 7yr', ema: 'N/A (uses RMP additional risk minimization)', ich: 'N/A', who: 'N/A', day0: 'FDA approval with REMS requirement', differences: 'US-specific. REMS can include ETASU, medication guides, communication plans.' },
  { reportType: 'Signal Detection & Evaluation', category: 'Risk Management', fda: 'Ongoing (no fixed timeline); FDA Sentinel active surveillance', ema: 'Monthly screening (EU signal management process)', ich: 'No fixed timeline (E2E guidance)', who: 'VigiBase screening cycles', day0: 'Continuous process', differences: 'EMA has formalized monthly signal detection. FDA uses Sentinel + FAERS mining.' },

  /* === Post-Marketing Commitments === */
  { reportType: 'Post-Marketing Study Report (PASS/PMR)', category: 'Post-Marketing', fda: 'Annual status reports; final report per agreed timeline', ema: 'Per PASS protocol; interim + final reports to PRAC', ich: 'N/A (jurisdiction-specific)', who: 'N/A', day0: 'Study protocol approval date', differences: 'FDA PMR and EMA PASS have different governance structures' },
  { reportType: 'Safety Variation / Labeling Update', category: 'Post-Marketing', fda: 'CBE-0 (immediate), CBE-30, PAS', ema: 'Type IA, IAIN, IB, Type II (per urgency)', ich: 'N/A (jurisdiction-specific)', who: 'N/A', day0: 'Date safety issue identified requiring labeling change', differences: 'FDA CBE-0 allows immediate implementation; EMA urgent safety restriction is equivalent' },
  { reportType: 'Urgent Safety Restriction', category: 'Post-Marketing', fda: 'CBE-0 supplement (immediate implementation)', ema: 'Immediate + notify within 24 hours', ich: 'N/A', who: 'Immediate action recommended', day0: 'Date risk identified requiring urgent action', differences: 'EMA requires 24h notification to national competent authorities' },

  /* === Regulatory Submissions === */
  { reportType: 'MedWatch 3500A (Mandatory)', category: 'FDA-Specific', fda: '15 days (serious), periodic (non-serious)', ema: 'N/A', ich: 'N/A', who: 'N/A', day0: 'Date manufacturer becomes aware', differences: 'FDA-specific mandatory reporting form for manufacturers' },
  { reportType: 'EudraVigilance Submission', category: 'EMA-Specific', fda: 'N/A', ema: '15 days (serious), 90 days (non-serious) via E2B(R3)', ich: 'E2B(R3) format standard', who: 'VigiFlow for member states', day0: 'Date MAH becomes aware of case', differences: 'EMA mandates electronic submission via EudraVigilance; WHO uses VigiFlow' },
  { reportType: 'CIOMS I Form', category: 'International', fda: 'Accepted as attachment to MedWatch', ema: 'Superseded by E2B(R3) electronic submission', ich: 'Legacy format; E2B(R3) preferred', who: 'Accepted by some member states', day0: 'Per individual case awareness date', differences: 'Paper-based legacy format. E2B(R3) XML is the current international standard.' },

  /* === Aggregate Safety === */
  { reportType: 'Benefit-Risk Assessment Update', category: 'Aggregate', fda: 'Part of NDA annual report / PADER', ema: 'Part of PBRER (Module SVIII)', ich: 'PBRER Section 16 (E2C(R2))', who: 'Recommended in periodic reviews', day0: 'Per periodic reporting schedule', differences: 'All frameworks require B-R assessment; format varies by jurisdiction' },
  { reportType: 'Signal Summary Report', category: 'Aggregate', fda: 'Ad hoc to FDA; part of annual report', ema: 'Within 60 days of PRAC signal assessment', ich: 'Part of PBRER signal section', who: 'Part of WHO signal review process', day0: 'Date signal validated', differences: 'EMA has most structured signal governance via PRAC' },
];

const CATEGORIES = ['All', 'ICSR', 'Clinical Trial', 'Periodic', 'Risk Management', 'Post-Marketing', 'FDA-Specific', 'EMA-Specific', 'International', 'Aggregate'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  ICSR: 'text-red-400 bg-red-500/10 border-red-500/20',
  'Clinical Trial': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Periodic: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Risk Management': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Post-Marketing': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'FDA-Specific': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'EMA-Specific': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  International: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Aggregate: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const AUTHORITY_COLORS: Record<string, string> = {
  FDA: 'text-blue-400',
  EMA: 'text-cyan-400',
  ICH: 'text-emerald-400',
  WHO: 'text-amber-400',
};

function AuthorityCell({ authority, value }: { authority: string; value: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-2.5">
      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 font-mono ${AUTHORITY_COLORS[authority] ?? 'text-slate-400'}`}>
        {authority}
      </p>
      <p className="text-[10px] text-slate-300 font-mono leading-relaxed">{value}</p>
    </div>
  );
}

export function ReportingTimelines() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TIMELINES.filter((t) => {
      const catMatch = category === 'All' || t.category === category;
      const searchMatch = !q
        || t.reportType.toLowerCase().includes(q)
        || t.fda.toLowerCase().includes(q)
        || t.ema.toLowerCase().includes(q)
        || t.differences.toLowerCase().includes(q)
        || t.day0.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [search, category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
        </div>
        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
          Reporting Timelines
        </h1>
        <p className="mt-2 text-slate-400 max-w-3xl text-sm">
          Cross-jurisdictional comparison of PV reporting deadlines. FDA, EMA, ICH, and WHO requirements side-by-side.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search timelines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono placeholder:text-slate-600"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest transition-all ${
                category === cat
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                  : 'border border-slate-700 bg-slate-950 text-slate-500 hover:border-slate-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-4">
        {filtered.length} TIMELINES
      </p>

      {/* Timeline Cards */}
      <div className="space-y-3">
        {filtered.map((t) => (
          <div
            key={t.reportType}
            className="border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-white font-mono">{t.reportType}</h3>
              <span className={`px-2 py-0.5 border text-[9px] font-bold font-mono uppercase flex-shrink-0 ${CATEGORY_COLORS[t.category] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                {t.category}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <AuthorityCell authority="FDA" value={t.fda} />
              <AuthorityCell authority="EMA" value={t.ema} />
              <AuthorityCell authority="ICH" value={t.ich} />
              <AuthorityCell authority="WHO" value={t.who} />
            </div>

            <div className="flex flex-col md:flex-row gap-4 text-[10px]">
              <div className="flex-1">
                <span className="font-bold text-slate-600 uppercase tracking-widest font-mono">Day 0: </span>
                <span className="text-slate-400 font-mono">{t.day0}</span>
              </div>
              <div className="flex-1">
                <span className="font-bold text-amber-500/80 uppercase tracking-widest font-mono flex items-center gap-1 inline-flex">
                  <AlertTriangle className="w-3 h-3" />
                  Key Differences:{' '}
                </span>
                <span className="text-slate-400 font-mono">{t.differences}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-slate-800 bg-slate-900/30 p-12 text-center">
          <p className="text-slate-500 font-mono text-sm">No timelines match your filters.</p>
        </div>
      )}
    </div>
  );
}
