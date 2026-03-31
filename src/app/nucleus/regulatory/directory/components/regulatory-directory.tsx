'use client';

import { useState, useMemo } from 'react';
import { Search, ExternalLink, FileText, Scale, Shield, AlertTriangle } from 'lucide-react';

interface RegDoc {
  id: string;
  title: string;
  jurisdiction: string;
  docType: string;
  status: string;
  activity: string;
  riskLevel: string;
  summary: string;
  url: string;
}

const DOCS: RegDoc[] = [
  /* === FDA — Code of Federal Regulations === */
  { id: 'FDA-CFR-001', title: '21 CFR 312.32 — IND Safety Reporting', jurisdiction: 'FDA', docType: 'Regulation', status: 'Active', activity: 'Safety Reporting', riskLevel: 'Critical', summary: 'Requires sponsors to notify FDA and investigators of serious and unexpected ADRs. 7-day alert for fatal/life-threatening; 15-day written report for all serious unexpected.', url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-312/subpart-B/section-312.32' },
  { id: 'FDA-CFR-002', title: '21 CFR 314.80 — Post-Marketing Reporting of ADEs', jurisdiction: 'FDA', docType: 'Regulation', status: 'Active', activity: 'Safety Reporting', riskLevel: 'Critical', summary: 'Requires NDA holders to report serious, unexpected ADEs within 15 days. Periodic reporting (quarterly years 1-3, annually thereafter) via PADER.', url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-314/subpart-B/section-314.80' },
  { id: 'FDA-CFR-003', title: '21 CFR 314.81 — Annual Reports for NDAs', jurisdiction: 'FDA', docType: 'Regulation', status: 'Active', activity: 'Periodic Reporting', riskLevel: 'High', summary: 'Annual progress reports including distribution data, labeling, chemistry changes, non-clinical studies, and clinical data.', url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-314/subpart-B/section-314.81' },
  { id: 'FDA-CFR-004', title: '21 CFR 600.80 — Post-Marketing Reporting for Biologics', jurisdiction: 'FDA', docType: 'Regulation', status: 'Active', activity: 'Safety Reporting', riskLevel: 'Critical', summary: 'Biologics-specific safety reporting requirements parallel to 314.80. 15-day reports for serious unexpected ADRs.', url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-F/part-600/subpart-D/section-600.80' },
  { id: 'FDA-STAT-001', title: 'FDCA Section 505(k) — Safety Reporting Requirements', jurisdiction: 'FDA', docType: 'Statute', status: 'Active', activity: 'Safety Reporting', riskLevel: 'Critical', summary: 'Statutory authority for FDA post-marketing safety reporting. Mandates records and reports for approved drugs.', url: '' },
  { id: 'FDA-STAT-002', title: 'FDAAA Section 901 — REMS Authority', jurisdiction: 'FDA', docType: 'Statute', status: 'Active', activity: 'Risk Management', riskLevel: 'Critical', summary: 'Grants FDA authority to require REMS when necessary to ensure benefits outweigh risks. Includes ETASU provisions.', url: '' },
  { id: 'FDA-GUID-001', title: 'Safety Reporting Requirements for INDs and BA/BE Studies', jurisdiction: 'FDA', docType: 'Guidance', status: 'Final', activity: 'Safety Reporting', riskLevel: 'High', summary: 'Guidance on IND safety reporting under 21 CFR 312.32. Clarifies what constitutes a suspected adverse reaction and reporting obligations.', url: '' },
  { id: 'FDA-GUID-002', title: 'Postmarketing Safety Reporting for Combination Products', jurisdiction: 'FDA', docType: 'Guidance', status: 'Final', activity: 'Safety Reporting', riskLevel: 'High', summary: 'Addresses how combination product applicants should comply with post-marketing safety reporting requirements.', url: '' },
  { id: 'FDA-GUID-003', title: 'Good Pharmacovigilance Practices and Pharmacoepidemiologic Assessment', jurisdiction: 'FDA', docType: 'Guidance', status: 'Final', activity: 'Signal Detection', riskLevel: 'High', summary: 'FDA guidance on pharmacovigilance practices including signal detection, pharmacoepidemiologic studies, and risk management.', url: '' },

  /* === ICH Guidelines === */
  { id: 'ICH-E2A', title: 'ICH E2A — Clinical Safety Data Management: Definitions and Standards for Expedited Reporting', jurisdiction: 'ICH', docType: 'Guideline', status: 'Active', activity: 'Safety Reporting', riskLevel: 'Critical', summary: 'Defines ADR, serious, unexpected. Establishes 7/15-day expedited reporting framework adopted by all ICH regions.', url: 'https://database.ich.org/sites/default/files/E2A_Guideline.pdf' },
  { id: 'ICH-E2B-R3', title: 'ICH E2B(R3) — Individual Case Safety Reports (ICSRs)', jurisdiction: 'ICH', docType: 'Guideline', status: 'Active', activity: 'Safety Reporting', riskLevel: 'Critical', summary: 'Defines ICSR data elements and XML message format for electronic transmission between stakeholders.', url: 'https://database.ich.org/sites/default/files/E2B_R3__Guideline.pdf' },
  { id: 'ICH-E2C-R2', title: 'ICH E2C(R2) — Periodic Benefit-Risk Evaluation Report (PBRER)', jurisdiction: 'ICH', docType: 'Guideline', status: 'Active', activity: 'Periodic Reporting', riskLevel: 'Critical', summary: 'Standard format for periodic reporting. Replaced PSUR. Comprehensive B-R evaluation at defined intervals.', url: 'https://database.ich.org/sites/default/files/E2C_R2_Guideline.pdf' },
  { id: 'ICH-E2D', title: 'ICH E2D — Post-Approval Safety Data Management', jurisdiction: 'ICH', docType: 'Guideline', status: 'Active', activity: 'Safety Reporting', riskLevel: 'High', summary: 'Standards for post-approval expedited and periodic reporting, literature review, and special situations.', url: 'https://database.ich.org/sites/default/files/E2D_Guideline.pdf' },
  { id: 'ICH-E2E', title: 'ICH E2E — Pharmacovigilance Planning', jurisdiction: 'ICH', docType: 'Guideline', status: 'Active', activity: 'Risk Management', riskLevel: 'High', summary: 'Framework for pharmacovigilance planning including safety specification and PV plan development.', url: 'https://database.ich.org/sites/default/files/E2E_Guideline.pdf' },
  { id: 'ICH-E2F', title: 'ICH E2F — Development Safety Update Report (DSUR)', jurisdiction: 'ICH', docType: 'Guideline', status: 'Active', activity: 'Periodic Reporting', riskLevel: 'High', summary: 'Annual safety report during drug development. Comprehensive review of clinical trial safety data.', url: 'https://database.ich.org/sites/default/files/E2F_Guideline.pdf' },
  { id: 'ICH-E6-R2', title: 'ICH E6(R2) — Good Clinical Practice', jurisdiction: 'ICH', docType: 'Guideline', status: 'Active', activity: 'Clinical Trials', riskLevel: 'Critical', summary: 'International standard for clinical trial design, conduct, recording, and reporting. Section 4.11 covers safety reporting.', url: 'https://database.ich.org/sites/default/files/E6_R2__Addendum.pdf' },
  { id: 'ICH-M1', title: 'ICH M1 — MedDRA: Medical Dictionary for Regulatory Activities', jurisdiction: 'ICH', docType: 'Standard', status: 'Active', activity: 'Coding', riskLevel: 'High', summary: 'Standardised medical terminology for regulatory communication. 5-level hierarchy from LLT to SOC.', url: 'https://www.meddra.org/' },

  /* === EMA / EU Regulations === */
  { id: 'EU-REG-001', title: 'Regulation (EC) No 726/2004 — Centralised Procedure', jurisdiction: 'EMA', docType: 'Regulation', status: 'Active', activity: 'Authorisation & PV', riskLevel: 'Critical', summary: 'EU regulation establishing the centralised marketing authorisation procedure and pharmacovigilance obligations.', url: '' },
  { id: 'EU-DIR-001', title: 'Directive 2001/83/EC — Community Code for Medicinal Products', jurisdiction: 'EMA', docType: 'Directive', status: 'Active', activity: 'Authorisation & PV', riskLevel: 'Critical', summary: 'EU directive establishing requirements for marketing authorisation, manufacturing, labelling, and pharmacovigilance.', url: '' },
  { id: 'EU-IR-001', title: 'Commission Implementing Regulation (EU) No 520/2012', jurisdiction: 'EMA', docType: 'Regulation', status: 'Active', activity: 'PV Operations', riskLevel: 'High', summary: 'Detailed rules for pharmacovigilance activities including PSMF, QPPV requirements, and signal management process.', url: '' },
  { id: 'GVP-I', title: 'GVP Module I — Pharmacovigilance Systems and Quality Systems', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'PV Operations', riskLevel: 'Critical', summary: 'Requirements for PSMF, QPPV, quality system, and overall PV system structure.', url: 'https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/pharmacovigilance/good-pharmacovigilance-practices' },
  { id: 'GVP-V', title: 'GVP Module V — Risk Management Systems', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'Risk Management', riskLevel: 'Critical', summary: 'EU Risk Management Plan requirements including safety specification, PV plan, and risk minimisation measures.', url: '' },
  { id: 'GVP-VI', title: 'GVP Module VI — Collection, Management and Submission of ICSRs', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'Safety Reporting', riskLevel: 'Critical', summary: 'Detailed requirements for ICSR handling including collection, quality, coding, and EudraVigilance submission.', url: '' },
  { id: 'GVP-VII', title: 'GVP Module VII — Periodic Safety Update Report', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'Periodic Reporting', riskLevel: 'Critical', summary: 'EU-specific requirements for PBRER preparation and submission per EURD list schedule.', url: '' },
  { id: 'GVP-VIII', title: 'GVP Module VIII — Post-Authorisation Safety Studies (PASS)', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'Post-Marketing Studies', riskLevel: 'High', summary: 'Framework for conducting PASS including imposed and voluntary studies, EU PAS register requirements.', url: '' },
  { id: 'GVP-IX', title: 'GVP Module IX — Signal Management', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'Signal Detection', riskLevel: 'Critical', summary: 'EU signal management process: detection, validation, analysis, prioritisation, and assessment. PRAC signal procedure.', url: '' },
  { id: 'GVP-X', title: 'GVP Module X — Additional Monitoring', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'Monitoring', riskLevel: 'High', summary: 'Black triangle scheme for products under additional monitoring. Enhanced ADR reporting requirements.', url: '' },
  { id: 'GVP-XV', title: 'GVP Module XV — Safety Communication', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'Risk Communication', riskLevel: 'High', summary: 'Guidance on safety communication including DHPC, press releases, and stakeholder engagement.', url: '' },
  { id: 'GVP-XVI', title: 'GVP Module XVI — Risk Minimisation Measures', jurisdiction: 'EMA', docType: 'GVP Module', status: 'Active', activity: 'Risk Management', riskLevel: 'High', summary: 'Selection, implementation, and effectiveness evaluation of routine and additional risk minimisation measures.', url: '' },

  /* === WHO === */
  { id: 'WHO-001', title: 'WHO International Drug Monitoring Programme', jurisdiction: 'WHO', docType: 'Programme', status: 'Active', activity: 'Global PV', riskLevel: 'High', summary: 'WHO programme coordinating global ADR monitoring through national pharmacovigilance centres and VigiBase.', url: '' },
  { id: 'WHO-002', title: 'WHO Guidelines on Safety Monitoring of Herbal Medicines', jurisdiction: 'WHO', docType: 'Guideline', status: 'Active', activity: 'Safety Monitoring', riskLevel: 'Medium', summary: 'Framework for monitoring safety of herbal medicines within national PV systems.', url: '' },
  { id: 'WHO-003', title: 'WHO Pharmacovigilance Indicators: A Practical Manual', jurisdiction: 'WHO', docType: 'Manual', status: 'Active', activity: 'PV Assessment', riskLevel: 'Medium', summary: 'Structural, process, and outcome indicators for assessing PV system performance.', url: '' },

  /* === CIOMS === */
  { id: 'CIOMS-V', title: 'CIOMS V — Current Challenges in Pharmacovigilance', jurisdiction: 'CIOMS', docType: 'Report', status: 'Active', activity: 'PV Best Practices', riskLevel: 'Medium', summary: 'Pragmatic approaches to pharmacovigilance including signal detection, benefit-risk assessment, and communication.', url: '' },
  { id: 'CIOMS-VIII', title: 'CIOMS VIII — Signal Detection', jurisdiction: 'CIOMS', docType: 'Report', status: 'Active', activity: 'Signal Detection', riskLevel: 'High', summary: 'Comprehensive guide to signal detection methodologies including statistical methods, data sources, and governance.', url: '' },
  { id: 'CIOMS-IX', title: 'CIOMS IX — Practical Approaches to Risk Minimisation', jurisdiction: 'CIOMS', docType: 'Report', status: 'Active', activity: 'Risk Management', riskLevel: 'High', summary: 'Framework for selecting and evaluating risk minimisation measures across jurisdictions.', url: '' },
  { id: 'CIOMS-X', title: 'CIOMS X — Meta-Analysis and Safety', jurisdiction: 'CIOMS', docType: 'Report', status: 'Active', activity: 'Safety Analysis', riskLevel: 'Medium', summary: 'Guidance on using meta-analysis for safety evaluation, including systematic reviews and evidence synthesis.', url: '' },

  /* === MHRA (UK) === */
  { id: 'MHRA-001', title: 'UK Human Medicines Regulations 2012', jurisdiction: 'MHRA', docType: 'Regulation', status: 'Active', activity: 'PV Requirements', riskLevel: 'Critical', summary: 'UK statutory framework for medicines regulation including pharmacovigilance obligations post-Brexit.', url: '' },
  { id: 'MHRA-002', title: 'MHRA GVP — UK-Specific Annexes', jurisdiction: 'MHRA', docType: 'Guidance', status: 'Active', activity: 'PV Operations', riskLevel: 'High', summary: 'UK-specific pharmacovigilance guidance supplementing EU GVP modules, addressing post-Brexit requirements.', url: '' },
  { id: 'MHRA-003', title: 'Yellow Card Scheme — ADR Reporting', jurisdiction: 'MHRA', docType: 'Programme', status: 'Active', activity: 'Safety Reporting', riskLevel: 'High', summary: 'UK national ADR reporting system for healthcare professionals and patients. Over 60 years of operation.', url: 'https://yellowcard.mhra.gov.uk/' },

  /* === PMDA (Japan) === */
  { id: 'PMDA-001', title: 'J-GVP — Japanese Good Vigilance Practice', jurisdiction: 'PMDA', docType: 'Regulation', status: 'Active', activity: 'PV Operations', riskLevel: 'Critical', summary: 'Japanese GVP regulations for safety management of drugs including collection, evaluation, and reporting of safety information.', url: '' },
  { id: 'PMDA-002', title: 'PMDA Safety Measures Consultation', jurisdiction: 'PMDA', docType: 'Programme', status: 'Active', activity: 'Risk Management', riskLevel: 'High', summary: 'PMDA consultation process for safety measures, including RMP Japan and additional pharmacovigilance activities.', url: '' },

  /* === TGA (Australia) === */
  { id: 'TGA-001', title: 'Therapeutic Goods Act 1989 — Safety Provisions', jurisdiction: 'TGA', docType: 'Legislation', status: 'Active', activity: 'PV Requirements', riskLevel: 'Critical', summary: 'Australian legislative framework for therapeutic goods regulation including adverse event reporting obligations.', url: '' },
  { id: 'TGA-002', title: 'TGA Pharmacovigilance Responsibilities of Sponsors', jurisdiction: 'TGA', docType: 'Guidance', status: 'Active', activity: 'PV Operations', riskLevel: 'High', summary: 'TGA guidance on sponsor obligations for adverse event monitoring, reporting, and risk management in Australia.', url: '' },

  /* === Health Canada === */
  { id: 'HC-001', title: 'Food and Drug Regulations C.01.017 — Adverse Reaction Reporting', jurisdiction: 'Health Canada', docType: 'Regulation', status: 'Active', activity: 'Safety Reporting', riskLevel: 'Critical', summary: 'Canadian regulation requiring MAHs to report serious ADRs within 15 days and all ADRs annually.', url: '' },
  { id: 'HC-002', title: 'Guidance: Mandatory Reporting of Serious ADRs', jurisdiction: 'Health Canada', docType: 'Guidance', status: 'Active', activity: 'Safety Reporting', riskLevel: 'High', summary: 'Health Canada guidance on mandatory reporting including definitions, timelines, and Canada Vigilance requirements.', url: '' },
];

const JURISDICTIONS = ['All', 'FDA', 'ICH', 'EMA', 'WHO', 'CIOMS', 'MHRA', 'PMDA', 'TGA', 'Health Canada'] as const;
const RISK_LEVELS = ['All', 'Critical', 'High', 'Medium'] as const;

const JURISDICTION_COLORS: Record<string, string> = {
  FDA: 'text-blue-400',
  EMA: 'text-cyan-400',
  ICH: 'text-emerald-400',
  WHO: 'text-amber-400',
  CIOMS: 'text-purple-400',
  MHRA: 'text-pink-400',
  PMDA: 'text-rose-400',
  TGA: 'text-teal-400',
  'Health Canada': 'text-red-300',
};

const RISK_COLORS: Record<string, string> = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  High: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

function ActivityIcon({ activity }: { activity: string }) {
  switch (activity) {
    case 'Safety Reporting': return <AlertTriangle className="w-3 h-3" />;
    case 'Risk Management': return <Shield className="w-3 h-3" />;
    case 'Periodic Reporting': return <FileText className="w-3 h-3" />;
    default: return <Scale className="w-3 h-3" />;
  }
}

export function RegulatoryDirectory() {
  const [search, setSearch] = useState('');
  const [jurisdiction, setJurisdiction] = useState('All');
  const [riskLevel, setRiskLevel] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DOCS.filter((d) => {
      const jurMatch = jurisdiction === 'All' || d.jurisdiction === jurisdiction;
      const riskMatch = riskLevel === 'All' || d.riskLevel === riskLevel;
      const searchMatch = !q || d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q) || d.activity.toLowerCase().includes(q);
      return jurMatch && riskMatch && searchMatch;
    });
  }, [search, jurisdiction, riskLevel]);

  const criticalCount = DOCS.filter((d) => d.riskLevel === 'Critical').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
        </div>
        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
          Regulatory Directory
        </h1>
        <p className="mt-2 text-slate-400 max-w-3xl text-sm">
          Comprehensive catalog of global PV regulatory documents. Filterable by jurisdiction, activity, and compliance risk level.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Documents', value: String(DOCS.length), color: 'text-white' },
          { label: 'Jurisdictions', value: '9', color: 'text-cyan-400' },
          { label: 'Critical Risk', value: String(criticalCount), color: 'text-red-400' },
          { label: 'All Active', value: String(DOCS.length), color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="border border-slate-800 bg-slate-900/50 p-3 text-center">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">{stat.label}</p>
            <p className={`text-lg font-black font-mono ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            type="text"
            placeholder="Search documents by title, ID, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none font-mono placeholder:text-slate-600"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Jurisdiction filter */}
          <div>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-mono">Jurisdiction</p>
            <div className="flex flex-wrap gap-1">
              {JURISDICTIONS.map((j) => (
                <button
                  key={j}
                  onClick={() => setJurisdiction(j)}
                  className={`px-2 py-1 text-[9px] font-bold font-mono uppercase tracking-wide transition-all ${
                    jurisdiction === j
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                      : 'border border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          {/* Risk level filter */}
          <div>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-mono">Risk Level</p>
            <div className="flex gap-1">
              {RISK_LEVELS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskLevel(r)}
                  className={`px-2 py-1 text-[9px] font-bold font-mono uppercase tracking-wide transition-all ${
                    riskLevel === r
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                      : 'border border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Count */}
      <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-4">
        {filtered.length} DOCUMENTS
      </p>

      {/* Document list */}
      <div className="space-y-2">
        {filtered.map((d) => (
          <div
            key={d.id}
            className="border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black font-mono ${JURISDICTION_COLORS[d.jurisdiction] ?? 'text-slate-400'}`}>
                    {d.jurisdiction}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">{d.id}</span>
                </div>
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-white hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    {d.title}
                    <ExternalLink className="w-3 h-3 text-slate-600" />
                  </a>
                ) : (
                  <span className="text-sm font-bold text-white">{d.title}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2 py-0.5 bg-slate-800 text-[8px] font-bold text-slate-400 font-mono uppercase">
                  {d.docType}
                </span>
                <span className={`px-2 py-0.5 border text-[8px] font-bold font-mono uppercase ${RISK_COLORS[d.riskLevel] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                  {d.riskLevel}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{d.summary}</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-950 border border-slate-800 text-[8px] font-bold text-slate-500 font-mono uppercase">
              <ActivityIcon activity={d.activity} />
              {d.activity}
            </span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-slate-800 bg-slate-900/30 p-12 text-center">
          <p className="text-slate-500 font-mono text-sm">No documents match your filters.</p>
        </div>
      )}
    </div>
  );
}
