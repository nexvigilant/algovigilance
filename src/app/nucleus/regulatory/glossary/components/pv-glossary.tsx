'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface Term {
  acronym: string;
  full: string;
  definition: string;
  category: string;
}

const CATEGORIES = [
  'All', 'Core PV', 'Signal Detection', 'ICH', 'FDA', 'EMA',
  'Clinical', 'Coding', 'Labeling', 'Operations', 'International',
  'UK', 'Japan', 'Vaccines', 'Academy',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Core PV': 'text-red-400 bg-red-500/10 border-red-500/20',
  'Signal Detection': 'text-gold bg-gold/10 border-gold/20',
  'ICH': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'FDA': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'EMA': 'text-cyan bg-cyan/10 border-cyan/20',
  'Clinical': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Coding': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'Operations': 'text-slate-dim/60 bg-slate-dim/10 border-slate-dim/20',
  'International': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'UK': 'text-slate-dim/60 bg-slate-dim/10 border-slate-dim/20',
  'Japan': 'text-slate-dim/60 bg-slate-dim/10 border-slate-dim/20',
  'Vaccines': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Academy': 'text-gold bg-gold/10 border-gold/20',
};

const TERMS: Term[] = [
  { acronym: 'ADR', full: 'Adverse Drug Reaction', definition: 'A response to a medicinal product which is noxious and unintended, occurring at doses normally used in humans for prophylaxis, diagnosis, or therapy.', category: 'Core PV' },
  { acronym: 'AE', full: 'Adverse Event', definition: 'Any untoward medical occurrence in a patient administered a pharmaceutical product, which does not necessarily have a causal relationship with the treatment.', category: 'Core PV' },
  { acronym: 'AEFI', full: 'Adverse Event Following Immunisation', definition: 'Any untoward medical occurrence which follows immunisation and does not necessarily have a causal relationship with the usage of the vaccine.', category: 'Vaccines' },
  { acronym: 'AESI', full: 'Adverse Event of Special Interest', definition: 'Pre-defined adverse event requiring enhanced monitoring during clinical trials or post-marketing.', category: 'Core PV' },
  { acronym: 'BLA', full: 'Biologics License Application', definition: 'FDA application for licensure of biological products.', category: 'FDA' },
  { acronym: 'BPCA', full: 'Best Pharmaceuticals for Children Act', definition: 'US legislation providing incentives for paediatric drug studies.', category: 'FDA' },
  { acronym: 'CAPA', full: 'Corrective and Preventive Action', definition: 'Quality system process for identifying, correcting, and preventing recurrence of non-conformances.', category: 'Operations' },
  { acronym: 'CBE', full: 'Changes Being Effected', definition: 'FDA supplement type allowing labeling changes to be implemented immediately (CBE-0) or after 30 days (CBE-30).', category: 'FDA' },
  { acronym: 'CCDS', full: 'Company Core Data Sheet', definition: 'A document prepared by the MAH containing safety information for inclusion in all countries where the product is marketed.', category: 'Labeling' },
  { acronym: 'CCSI', full: 'Company Core Safety Information', definition: 'All relevant safety information in the CCDS prepared by the MAH for inclusion in product information worldwide.', category: 'Labeling' },
  { acronym: 'CDER', full: 'Center for Drug Evaluation and Research', definition: 'FDA center responsible for regulating human prescription and OTC drugs.', category: 'FDA' },
  { acronym: 'CFR', full: 'Code of Federal Regulations', definition: 'The codification of the general and permanent rules published by US federal departments and agencies. Title 21 covers food and drugs.', category: 'FDA' },
  { acronym: 'CHMP', full: 'Committee for Medicinal Products for Human Use', definition: 'EMA committee responsible for providing opinions on marketing authorisation applications.', category: 'EMA' },
  { acronym: 'CIOMS', full: 'Council for International Organizations of Medical Sciences', definition: 'International NGO jointly established by WHO and UNESCO. Publishes influential working group reports on PV topics.', category: 'International' },
  { acronym: 'CIOMS I', full: 'CIOMS Form I', definition: 'Standardised international form for reporting individual case safety reports. Precursor to E2B electronic reporting.', category: 'International' },
  { acronym: 'CRO', full: 'Contract Research Organisation', definition: 'Organisation contracted to perform clinical trial or PV activities on behalf of a sponsor or MAH.', category: 'Operations' },
  { acronym: 'CSR', full: 'Clinical Study Report', definition: 'A comprehensive document describing the methods, results, and analyses of a clinical trial (ICH E3).', category: 'Clinical' },
  { acronym: 'DLP', full: 'Data Lock Point', definition: 'Cut-off date for data inclusion in a periodic report (PBRER/PSUR).', category: 'Core PV' },
  { acronym: 'DME', full: 'Designated Medical Event', definition: 'Serious medical events that by their nature should be considered signals regardless of statistical threshold.', category: 'Signal Detection' },
  { acronym: 'DSUR', full: 'Development Safety Update Report', definition: 'Annual report providing comprehensive safety review during clinical development (ICH E2F).', category: 'ICH' },
  { acronym: 'E2A', full: 'ICH E2A Guideline', definition: 'Clinical Safety Data Management: Definitions and Standards for Expedited Reporting.', category: 'ICH' },
  { acronym: 'E2B(R3)', full: 'ICH E2B(R3) Guideline', definition: 'Individual Case Safety Report data elements and message specification for electronic transmission.', category: 'ICH' },
  { acronym: 'E2C(R2)', full: 'ICH E2C(R2) Guideline', definition: 'Periodic Benefit-Risk Evaluation Report (PBRER) format and content.', category: 'ICH' },
  { acronym: 'E2D', full: 'ICH E2D Guideline', definition: 'Post-Approval Safety Data Management: Definitions and Standards for Expedited Reporting.', category: 'ICH' },
  { acronym: 'E2E', full: 'ICH E2E Guideline', definition: 'Pharmacovigilance Planning.', category: 'ICH' },
  { acronym: 'E2F', full: 'ICH E2F Guideline', definition: 'Development Safety Update Report (DSUR).', category: 'ICH' },
  { acronym: 'EBGM', full: 'Empirical Bayesian Geometric Mean', definition: 'Bayesian data mining algorithm (Multi-Item Gamma Poisson Shrinker) used for signal detection in FAERS.', category: 'Signal Detection' },
  { acronym: 'EB05', full: 'EBGM Lower 5th Percentile', definition: 'Lower bound of the 90% CI of the EBGM. EB05 >= 2.0 indicates a potential signal.', category: 'Signal Detection' },
  { acronym: 'EMA', full: 'European Medicines Agency', definition: 'EU agency responsible for scientific evaluation, supervision, and safety monitoring of medicines.', category: 'EMA' },
  { acronym: 'ETASU', full: 'Elements to Assure Safe Use', definition: 'Components of a REMS that go beyond labeling, such as prescriber certification or restricted dispensing.', category: 'FDA' },
  { acronym: 'EURD', full: 'EU Reference Date', definition: 'Harmonised birth date for PSUR/PBRER submission scheduling across the EU.', category: 'EMA' },
  { acronym: 'EudraVigilance', full: 'EU Drug Regulating Authorities PV', definition: 'EMA system for managing and analysing ICSRs in the EU.', category: 'EMA' },
  { acronym: 'FAERS', full: 'FDA Adverse Event Reporting System', definition: 'FDA database containing adverse event reports, medication errors, and product quality complaints for drugs.', category: 'FDA' },
  { acronym: 'FDAAA', full: 'FDA Amendments Act of 2007', definition: 'US legislation expanding FDA authority for post-market safety, including REMS requirement.', category: 'FDA' },
  { acronym: 'GCP', full: 'Good Clinical Practice', definition: 'International ethical and scientific quality standard for designing, conducting, and recording clinical trials (ICH E6).', category: 'Clinical' },
  { acronym: 'GVP', full: 'Good Pharmacovigilance Practice', definition: 'EMA guidelines for the conduct of pharmacovigilance activities in the EU.', category: 'EMA' },
  { acronym: 'HLGT', full: 'High Level Group Term', definition: 'MedDRA hierarchy level linking High Level Terms to System Organ Classes.', category: 'Coding' },
  { acronym: 'HLT', full: 'High Level Term', definition: 'MedDRA hierarchy level grouping Preferred Terms by anatomy, pathology, physiology, or aetiology.', category: 'Coding' },
  { acronym: 'IBD', full: 'International Birth Date', definition: 'Date of the first marketing authorisation anywhere in the world, used as reference for PSUR/PBRER scheduling.', category: 'ICH' },
  { acronym: 'IC', full: 'Information Component', definition: 'Bayesian confidence propagation neural network measure used by WHO-UMC for signal detection.', category: 'Signal Detection' },
  { acronym: 'IC025', full: 'IC Lower 2.5th Percentile', definition: 'Lower bound of the 95% CI of the IC. IC025 > 0 indicates a potential signal.', category: 'Signal Detection' },
  { acronym: 'ICH', full: 'International Council for Harmonisation', definition: 'Organisation that brings together regulatory authorities and pharmaceutical industry to discuss scientific/technical aspects of drug registration.', category: 'International' },
  { acronym: 'ICSR', full: 'Individual Case Safety Report', definition: 'A structured report of one or more adverse events associated with an individual patient.', category: 'Core PV' },
  { acronym: 'IME', full: 'Important Medical Event', definition: 'EMA/MedDRA list of terms that are inherently serious, used for case seriousness assessment.', category: 'EMA' },
  { acronym: 'IND', full: 'Investigational New Drug', definition: 'FDA application to begin clinical trials of a new drug in humans.', category: 'FDA' },
  { acronym: 'KSB', full: 'Knowledge, Skills, and Behaviours', definition: 'Competency framework elements for PV professional development and apprenticeship standards.', category: 'Academy' },
  { acronym: 'LLT', full: 'Lowest Level Term', definition: 'Most specific level in MedDRA hierarchy, used for verbatim term coding.', category: 'Coding' },
  { acronym: 'MAH', full: 'Marketing Authorisation Holder', definition: 'The entity granted authorisation to market a medicinal product.', category: 'Core PV' },
  { acronym: 'MedDRA', full: 'Medical Dictionary for Regulatory Activities', definition: 'Standardised medical terminology used for regulatory communication and evaluation of data pertaining to medicinal products.', category: 'Coding' },
  { acronym: 'MHRA', full: 'Medicines and Healthcare products Regulatory Agency', definition: 'UK regulatory agency responsible for ensuring medicines and medical devices are acceptably safe.', category: 'UK' },
  { acronym: 'NCA', full: 'National Competent Authority', definition: 'National regulatory authority of an EU member state responsible for medicines regulation.', category: 'EMA' },
  { acronym: 'NDA', full: 'New Drug Application', definition: 'FDA application for approval to market a new drug.', category: 'FDA' },
  { acronym: 'PADER', full: 'Periodic Adverse Drug Experience Report', definition: 'FDA-specific periodic safety report for approved drugs (quarterly years 1-3, then annual).', category: 'FDA' },
  { acronym: 'PASS', full: 'Post-Authorisation Safety Study', definition: 'A study relating to an authorised product conducted to obtain further safety information or measure effectiveness of risk minimisation.', category: 'EMA' },
  { acronym: 'PBRER', full: 'Periodic Benefit-Risk Evaluation Report', definition: 'ICH E2C(R2) format for periodic reporting, replacing PSUR. Comprehensive evaluation at defined intervals.', category: 'ICH' },
  { acronym: 'PMDA', full: 'Pharmaceuticals and Medical Devices Agency', definition: 'Japanese regulatory agency responsible for ensuring safety, efficacy, and quality of pharmaceuticals.', category: 'Japan' },
  { acronym: 'PMR', full: 'Post-Marketing Requirement', definition: 'FDA-required study or clinical trial after drug approval to gather additional safety or efficacy data.', category: 'FDA' },
  { acronym: 'PRAC', full: 'Pharmacovigilance Risk Assessment Committee', definition: 'EMA committee responsible for assessing and monitoring safety issues for human medicines.', category: 'EMA' },
  { acronym: 'PRR', full: 'Proportional Reporting Ratio', definition: 'Signal detection metric comparing reporting frequency of a drug-event combination to background. PRR >= 2.0 suggests signal.', category: 'Signal Detection' },
  { acronym: 'PSMF', full: 'Pharmacovigilance System Master File', definition: "Comprehensive description of a MAH's pharmacovigilance system, required by EU legislation.", category: 'EMA' },
  { acronym: 'PSUR', full: 'Periodic Safety Update Report', definition: 'Legacy term for periodic safety reporting, now replaced by PBRER (ICH E2C(R2)).', category: 'Core PV' },
  { acronym: 'PT', full: 'Preferred Term', definition: 'MedDRA hierarchy level representing a single medical concept for symptoms, signs, diseases, diagnoses.', category: 'Coding' },
  { acronym: 'QPPV', full: 'Qualified Person Responsible for Pharmacovigilance', definition: 'Individual nominated by MAH as responsible for PV system oversight in the EU.', category: 'EMA' },
  { acronym: 'REMS', full: 'Risk Evaluation and Mitigation Strategy', definition: 'FDA-required risk management program to ensure benefits outweigh risks for certain medications.', category: 'FDA' },
  { acronym: 'RMP', full: 'Risk Management Plan', definition: 'EMA-required document describing safety profile, pharmacovigilance plan, and risk minimisation measures.', category: 'EMA' },
  { acronym: 'ROR', full: 'Reporting Odds Ratio', definition: 'Signal detection metric calculated as odds ratio comparing a specific drug-event pair to all other combinations.', category: 'Signal Detection' },
  { acronym: 'RSI', full: 'Reference Safety Information', definition: "The safety information in the CCDS or investigator's brochure used to determine expectedness.", category: 'Core PV' },
  { acronym: 'SAE', full: 'Serious Adverse Event', definition: 'Any AE that results in death, is life-threatening, requires hospitalisation, results in disability, congenital anomaly, or other medically important condition.', category: 'Core PV' },
  { acronym: 'SmPC', full: 'Summary of Product Characteristics', definition: 'EU product information document for healthcare professionals, containing prescribing information.', category: 'Labeling' },
  { acronym: 'SMQ', full: 'Standardised MedDRA Query', definition: 'Validated, pre-defined grouping of MedDRA terms for identifying cases of a particular medical condition.', category: 'Coding' },
  { acronym: 'SOC', full: 'System Organ Class', definition: 'Highest level of the MedDRA hierarchy, grouping terms by aetiology (e.g., Cardiac disorders).', category: 'Coding' },
  { acronym: 'SOP', full: 'Standard Operating Procedure', definition: 'Written documented procedure for performing PV activities consistently and in compliance with regulations.', category: 'Operations' },
  { acronym: 'SPRT', full: 'Sequential Probability Ratio Test', definition: 'Sequential analysis statistical method used in continuous pharmacovigilance signal monitoring.', category: 'Signal Detection' },
  { acronym: 'SUSAR', full: 'Suspected Unexpected Serious Adverse Reaction', definition: 'A serious ADR that is not listed in the applicable product information (IB or SmPC). Requires expedited reporting.', category: 'Clinical' },
  { acronym: 'TGA', full: 'Therapeutic Goods Administration', definition: 'Australian regulatory agency responsible for evaluating, assessing, and monitoring therapeutic goods.', category: 'International' },
  { acronym: 'USPI', full: 'United States Prescribing Information', definition: 'FDA-approved labeling for prescription drugs, structured per 21 CFR 201.57.', category: 'FDA' },
  { acronym: 'VigiBase', full: 'WHO Global ICSR Database', definition: 'The world\'s largest database of ICSRs, maintained by WHO-UMC, containing reports from 140+ countries.', category: 'International' },
  { acronym: 'WHO-ART', full: 'WHO Adverse Reaction Terminology', definition: 'Legacy adverse reaction terminology, predecessor to MedDRA. Still used by some national centres.', category: 'Coding' },
  { acronym: 'WHO-UMC', full: 'WHO Uppsala Monitoring Centre', definition: 'The WHO Collaborating Centre for International Drug Monitoring, maintaining VigiBase.', category: 'International' },
];

export function PvGlossary() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TERMS.filter(t => {
      const catMatch = category === 'All' || t.category === category;
      const searchMatch = !q
        || t.acronym.toLowerCase().includes(q)
        || t.full.toLowerCase().includes(q)
        || t.definition.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [search, category]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Regulatory Intelligence / Terminology</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          PV Glossary
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-2xl">
          Pharmacovigilance acronyms, definitions, and regulatory terminology. Sourced from ICH, FDA, EMA, WHO, and CIOMS frameworks.
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-dim/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search acronyms, terms, or definitions..."
          className="w-full bg-black/20 border border-nex-light/30 pl-9 pr-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-2.5 py-1 border text-[9px] font-bold font-mono uppercase tracking-widest transition-all ${
              category === cat
                ? 'bg-cyan/10 border-cyan/40 text-cyan'
                : 'border-nex-light/20 bg-black/20 text-slate-dim/40 hover:border-nex-light/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-slate-dim/30 font-mono uppercase tracking-widest mb-4">
        {filtered.length} terms
      </p>

      {/* Term list */}
      <div className="space-y-2">
        {filtered.map((t) => (
          <div key={t.acronym} className="border border-nex-light/10 bg-nex-surface/20 p-4 hover:border-nex-light/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="min-w-[80px]">
                <span className="text-sm font-black text-cyan font-mono">{t.acronym}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">{t.full}</span>
                  <span className={`px-2 py-0.5 border text-[8px] font-bold font-mono uppercase ${CATEGORY_COLORS[t.category] || 'text-slate-dim/40 bg-slate-dim/5 border-slate-dim/20'}`}>
                    {t.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-dim/50 leading-relaxed">{t.definition}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
