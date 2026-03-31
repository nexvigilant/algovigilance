/**
 * Dashboard Station Client — calls AlgoVigilance Station tools for production PV workflows.
 *
 * Wiring map (Anatomy → Nervous System):
 *   Drug identity     → rxnav_nlm_nih_gov_*
 *   FAERS data        → api_fda_gov_*
 *   Signal detection  → calculate_nexvigilant_com_compute_*
 *   Labeling          → dailymed_nlm_nih_gov_*
 *   Literature        → pubmed_ncbi_nlm_nih_gov_*
 *   Causality         → pv-engine_nexvigilant_com_assess_*       ← Guardian PV Engine
 *   Seriousness       → pv-engine_nexvigilant_com_classify_*     ← Guardian PV Engine
 *   Regulatory        → pv-engine_nexvigilant_com_determine_*    ← Guardian PV Engine
 *   ICSR validation   → pv-engine_nexvigilant_com_validate_*     ← Guardian PV Engine
 *   PSUR/DSUR         → pv-engine_nexvigilant_com_calculate_*    ← Guardian PV Engine
 *   Clinical trials   → clinicaltrials_gov_*
 *   ICH guidelines    → ich_org_*
 *   FDA approvals     → accessdata_fda_gov_*
 *   EMA signals       → ema_europa_eu_*
 */

const STATION = "https://mcp.nexvigilant.com";

export async function callStation(
  tool: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${STATION}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: tool, arguments: args },
        id: `dashboard-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.result?.content?.[0]?.text;
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  } catch {
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DrugIdentity {
  rxcui: string;
  name: string;
  synonym?: string;
  tty?: string;
}

export interface FaersEvent {
  term: string;
  count: number;
}

export interface DisproportionalityResult {
  drug: string;
  event: string;
  prr?: number;
  ror?: number;
  ic?: number;
  ebgm?: number;
  signal: boolean;
  cases?: number;
  chi_squared?: number;
}

export interface LabelSection {
  section: string;
  text: string;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  journal?: string;
  year?: string;
  abstract?: string;
}

export interface NaranjoResult {
  score: number;
  category: string;
  answers: Record<string, number>;
  questions?: Record<string, { answer: string; score: number; description: string }>;
}

export interface WhoUmcResult {
  category: string;
  description: string;
  criteria_met: string[];
}

export interface SeriousnessResult {
  is_serious: boolean;
  criteria_met: { criterion: string; description: string }[];
  highest_criterion: string | null;
}

export interface ExpeditedReportResult {
  report_type: string;
  deadline_days: number;
  is_expedited: boolean;
  rationale: string;
  criteria_met: string[];
  region: string;
}

export interface SubmissionDeadlineResult {
  awareness_date: string;
  deadline_date: string;
  calendar_days: number;
  is_overdue: boolean;
  days_remaining: number | null;
}

export interface PSURIntervalResult {
  report_type: string;
  period_start: string;
  period_end: string;
  submission_deadline: string;
  interval_months: number;
  period_number: number;
}

export interface ICSRValidationResult {
  status: string;
  is_valid: boolean;
  elements_present: string[];
  elements_missing: string[];
  completeness_score: number;
}

export interface RegulatoryGuideline {
  id: string;
  title: string;
  summary: string;
  url?: string;
}

export interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase?: string;
  enrollment?: number;
}

export interface StepStatus {
  status: "pending" | "loading" | "done" | "error";
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

// ─── Drug Identification (RxNav) ────────────────────────────────────────────

export async function resolveDrug(name: string): Promise<DrugIdentity | null> {
  const result = await callStation("rxnav_nlm_nih_gov_get_rxcui", { name });
  if (!result) return null;
  return {
    rxcui: String(result.rxcui ?? result.id ?? ""),
    name: String(result.name ?? name),
    synonym: result.synonym ? String(result.synonym) : undefined,
    tty: result.tty ? String(result.tty) : undefined,
  };
}

// ─── FAERS Queries (openFDA) ────────────────────────────────────────────────

export async function searchFaers(drug: string, limit = 20): Promise<FaersEvent[]> {
  const result = await callStation("api_fda_gov_search_adverse_events", {
    drug,
    limit: 50,
  });
  if (!result) return [];

  const cases = result.results as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(cases) || cases.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const c of cases) {
    const reactions = c.reactions;
    if (Array.isArray(reactions)) {
      for (const r of reactions) {
        const term = String(r).trim();
        if (term && term !== "Unknown" && term.length > 1) {
          counts[term] = (counts[term] ?? 0) + 1;
        }
      }
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

export async function getFaersOutcomes(
  drug: string,
): Promise<{ serious: number; deaths: number; hospitalizations: number; total: number } | null> {
  const result = await callStation("api_fda_gov_search_adverse_events", {
    drug,
    limit: 100,
  });
  if (!result) return null;

  const cases = result.results as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(cases)) return null;

  let serious = 0;
  let deaths = 0;
  let hospitalizations = 0;

  for (const c of cases) {
    if (c.serious === 1 || c.serious === "1" || c.seriousnessdeath === "1") serious++;
    if (c.seriousnessdeath === "1") deaths++;
    if (c.seriousnesshospitalization === "1") hospitalizations++;
  }

  return { serious, deaths, hospitalizations, total: cases.length };
}

// ─── Signal Detection (Station Compute) ─────────────────────────────────────

export async function computeDisproportionality(
  drug: string,
  event: string,
): Promise<DisproportionalityResult | null> {
  const [prr, ror, ic, ebgm] = await Promise.all([
    callStation("calculate_nexvigilant_com_compute_prr", { drug, event }),
    callStation("calculate_nexvigilant_com_compute_ror", { drug, event }),
    callStation("calculate_nexvigilant_com_compute_ic", { drug, event }),
    callStation("calculate_nexvigilant_com_compute_ebgm", { drug, event }),
  ]);

  if (!prr && !ror && !ic && !ebgm) return null;

  const prrVal = prr ? Number(prr.prr ?? prr.value ?? 0) : undefined;
  const rorVal = ror ? Number(ror.ror ?? ror.value ?? 0) : undefined;
  const icVal = ic ? Number(ic.ic ?? ic.value ?? 0) : undefined;
  const ebgmVal = ebgm ? Number(ebgm.ebgm ?? ebgm.value ?? 0) : undefined;

  const isSignal =
    (prrVal !== undefined && prrVal > 2) ||
    (rorVal !== undefined && rorVal > 2) ||
    (icVal !== undefined && icVal > 0) ||
    (ebgmVal !== undefined && ebgmVal > 2);

  return {
    drug,
    event,
    prr: prrVal,
    ror: rorVal,
    ic: icVal,
    ebgm: ebgmVal,
    signal: isSignal,
    cases: prr ? Number(prr.a ?? prr.cases ?? 0) : undefined,
  };
}

// ─── Labeling (DailyMed) ────────────────────────────────────────────────────

export async function getDrugLabel(drug: string): Promise<LabelSection[]> {
  const [adr, boxed, warnings] = await Promise.all([
    callStation("dailymed_nlm_nih_gov_get_adverse_reactions", { drug }),
    callStation("dailymed_nlm_nih_gov_get_boxed_warning", { drug }),
    callStation("dailymed_nlm_nih_gov_get_warnings_and_precautions", { drug }),
  ]);

  const sections: LabelSection[] = [];
  if (adr) {
    sections.push({
      section: "Adverse Reactions",
      text: String(adr.text ?? adr.adverse_reactions ?? "No data available"),
    });
  }
  if (boxed) {
    sections.push({
      section: "Boxed Warning",
      text: String(boxed.text ?? boxed.warning ?? "No boxed warning"),
    });
  }
  if (warnings) {
    sections.push({
      section: "Warnings and Precautions",
      text: String(warnings.text ?? warnings.warnings ?? "No data available"),
    });
  }
  return sections;
}

// ─── Literature (PubMed) ────────────────────────────────────────────────────

export async function searchPubMed(
  drug: string,
  event: string,
  limit = 10,
): Promise<PubMedArticle[]> {
  const result = await callStation("pubmed_ncbi_nlm_nih_gov_search_signal_literature", {
    drug,
    event,
    limit,
  });
  if (!result) return [];
  const articles = (result.articles ?? result.results) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(articles)) return [];
  return articles.slice(0, limit).map((a) => ({
    pmid: String(a.pmid ?? a.id ?? ""),
    title: String(a.title ?? "Untitled"),
    journal: a.journal ? String(a.journal) : undefined,
    year: a.year ? String(a.year) : undefined,
    abstract: a.abstract ? String(a.abstract) : undefined,
  }));
}

export async function searchCaseReports(
  drug: string,
  event: string,
  limit = 5,
): Promise<PubMedArticle[]> {
  const result = await callStation("pubmed_ncbi_nlm_nih_gov_search_case_reports", {
    drug,
    event,
    limit,
  });
  if (!result) return [];
  const articles = (result.articles ?? result.results) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(articles)) return [];
  return articles.slice(0, limit).map((a) => ({
    pmid: String(a.pmid ?? a.id ?? ""),
    title: String(a.title ?? "Untitled"),
    journal: a.journal ? String(a.journal) : undefined,
    year: a.year ? String(a.year) : undefined,
  }));
}

// ─── Causality Assessment (Guardian PV Engine) ──────────────────────────────

export async function computeNaranjo(
  drug: string,
  event: string,
  answers: Record<string, number | string>,
): Promise<NaranjoResult | null> {
  // Map numeric answers to yes/no/unknown for the Guardian engine
  const mapped: Record<string, string> = {};
  for (const [key, val] of Object.entries(answers)) {
    if (typeof val === "string") {
      mapped[key] = val;
    } else {
      // Naranjo: positive = yes, negative = no, zero = unknown
      mapped[key] = val > 0 ? "yes" : val < 0 ? "no" : "unknown";
    }
  }

  const result = await callStation("pv-engine_nexvigilant_com_assess_naranjo", {
    drug,
    event,
    ...mapped,
  });
  if (!result) return null;
  return {
    score: Number(result.score ?? 0),
    category: String(result.category ?? "Unknown"),
    answers: (result.answers as Record<string, number>) ?? answers,
    questions: result.questions as Record<string, { answer: string; score: number; description: string }> | undefined,
  };
}

export async function computeWhoUmc(
  drug: string,
  event: string,
  params: {
    time_relationship: boolean;
    dechallenge: boolean;
    rechallenge: boolean;
    alternative_causes: boolean;
  },
): Promise<WhoUmcResult | null> {
  const result = await callStation("pv-engine_nexvigilant_com_assess_who_umc", {
    drug,
    event,
    ...params,
  });
  if (!result) return null;
  return {
    category: String(result.category ?? "Unassessable"),
    description: String(result.description ?? ""),
    criteria_met: Array.isArray(result.criteria_met) ? result.criteria_met.map(String) : [],
  };
}

// ─── Seriousness Classification (Guardian PV Engine) ────────────────────────

export async function classifySeriousness(
  eventDescription: string,
  criteria?: {
    resulted_in_death?: boolean;
    life_threatening?: boolean;
    hospitalization?: boolean;
    disability?: boolean;
    congenital_anomaly?: boolean;
    medically_significant?: boolean;
  },
): Promise<SeriousnessResult | null> {
  const result = await callStation("pv-engine_nexvigilant_com_classify_seriousness", {
    event_description: eventDescription,
    ...criteria,
  });
  if (!result) return null;
  return {
    is_serious: Boolean(result.is_serious),
    criteria_met: Array.isArray(result.criteria_met)
      ? (result.criteria_met as { criterion: string; description: string }[])
      : [],
    highest_criterion: result.highest_criterion ? String(result.highest_criterion) : null,
  };
}

// ─── Expedited Reporting (Guardian PV Engine) ───────────────────────────────

export async function determineExpeditedReporting(params: {
  is_serious: boolean;
  is_unexpected: boolean;
  is_fatal?: boolean;
  is_life_threatening?: boolean;
  is_dme?: boolean;
  region?: string;
  context?: string;
}): Promise<ExpeditedReportResult | null> {
  const result = await callStation("pv-engine_nexvigilant_com_determine_expedited_reporting", params);
  if (!result) return null;
  return {
    report_type: String(result.report_type ?? "non_expedited"),
    deadline_days: Number(result.deadline_days ?? 0),
    is_expedited: Boolean(result.is_expedited),
    rationale: String(result.rationale ?? ""),
    criteria_met: Array.isArray(result.criteria_met) ? result.criteria_met.map(String) : [],
    region: String(result.region ?? "ich"),
  };
}

// ─── Submission Deadline (Guardian PV Engine) ───────────────────────────────

export async function calculateSubmissionDeadline(
  awarenessDate: string,
  reportType: string,
  region?: string,
): Promise<SubmissionDeadlineResult | null> {
  const result = await callStation("pv-engine_nexvigilant_com_calculate_submission_deadline", {
    awareness_date: awarenessDate,
    report_type: reportType,
    region: region ?? "ich",
  });
  if (!result) return null;
  return {
    awareness_date: String(result.awareness_date ?? ""),
    deadline_date: String(result.deadline_date ?? ""),
    calendar_days: Number(result.calendar_days ?? 0),
    is_overdue: Boolean(result.is_overdue),
    days_remaining: result.days_remaining != null ? Number(result.days_remaining) : null,
  };
}

// ─── PSUR/PBRER Interval (Guardian PV Engine) ───────────────────────────────

export async function calculatePSURInterval(
  internationalBirthDate: string,
): Promise<PSURIntervalResult | null> {
  const result = await callStation("pv-engine_nexvigilant_com_calculate_psur_interval", {
    international_birth_date: internationalBirthDate,
  });
  if (!result) return null;
  return {
    report_type: String(result.report_type ?? "PBRER"),
    period_start: String(result.period_start ?? ""),
    period_end: String(result.period_end ?? ""),
    submission_deadline: String(result.submission_deadline ?? ""),
    interval_months: Number(result.interval_months ?? 0),
    period_number: Number(result.period_number ?? 0),
  };
}

// ─── ICSR Validation (Guardian PV Engine) ───────────────────────────────────

export async function validateICSR(params: {
  reporter_name?: string;
  reporter_country?: string;
  patient_initials?: string;
  patient_age?: string;
  patient_sex?: string;
  suspect_drug?: string;
  adverse_event?: string;
  event_date?: string;
}): Promise<ICSRValidationResult | null> {
  const result = await callStation("pv-engine_nexvigilant_com_validate_icsr_minimum", params);
  if (!result) return null;
  return {
    status: String(result.status ?? "invalid"),
    is_valid: Boolean(result.is_valid),
    elements_present: Array.isArray(result.elements_present) ? result.elements_present.map(String) : [],
    elements_missing: Array.isArray(result.elements_missing) ? result.elements_missing.map(String) : [],
    completeness_score: Number(result.completeness_score ?? 0),
  };
}

// ─── Regulatory (External APIs) ─────────────────────────────────────────────

export async function searchICHGuidelines(query: string): Promise<RegulatoryGuideline[]> {
  const result = await callStation("ich_org_search_guidelines", { query });
  if (!result) return [];
  const guidelines = (result.guidelines ?? result.results) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(guidelines)) return [];
  return guidelines.map((g) => ({
    id: String(g.id ?? g.code ?? ""),
    title: String(g.title ?? ""),
    summary: String(g.summary ?? g.description ?? ""),
    url: g.url ? String(g.url) : undefined,
  }));
}

export async function searchFDAApprovals(drug: string): Promise<Record<string, unknown> | null> {
  return await callStation("accessdata_fda_gov_search_approvals", { drug });
}

export async function getEMASafetySignals(drug: string): Promise<Record<string, unknown> | null> {
  return await callStation("ema_europa_eu_search_safety_signals", { drug });
}

// ─── Clinical Trials (ClinicalTrials.gov) ───────────────────────────────────

export async function searchClinicalTrials(
  drug: string,
  limit = 10,
): Promise<ClinicalTrial[]> {
  const result = await callStation("clinicaltrials_gov_search_trials", {
    query: drug,
    limit,
  });
  if (!result) return [];
  const trials = (result.trials ?? result.results ?? result.studies) as
    | Array<Record<string, unknown>>
    | undefined;
  if (!Array.isArray(trials)) return [];
  return trials.slice(0, limit).map((t) => ({
    nctId: String(t.nctId ?? t.nct_id ?? t.id ?? ""),
    title: String(t.title ?? t.briefTitle ?? ""),
    status: String(t.status ?? t.overallStatus ?? "Unknown"),
    phase: t.phase ? String(t.phase) : undefined,
    enrollment: t.enrollment ? Number(t.enrollment) : undefined,
  }));
}
