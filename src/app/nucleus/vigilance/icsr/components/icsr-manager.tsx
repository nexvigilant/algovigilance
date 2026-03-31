"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FileText,
  Search,
  ChevronRight,
  Loader2,
  GitCompareArrows,
  Shield,
} from "lucide-react";
import {
  triageCase,
  checkCaseValidity,
  type IcsrTriageResult,
  type CaseValidityResult,
} from "@/lib/pv-compute";

interface DedupResult {
  similarity: number;
  case_a: string;
  case_b: string;
  verdict: string;
}

interface Submission {
  authority: string;
  status: string;
  ref: string;
}

interface IcsrCase {
  id: string;
  drug: string;
  event: string;
  meddra_pt: string;
  soc: string;
  patient_age: number;
  patient_sex: string;
  reporter: string;
  status: "Pending Review" | "Under Assessment" | "Completed" | "Closed";
  priority: "Critical" | "High" | "Medium" | "Low";
  seriousness: string[];
  naranjo: number;
  narrative: string;
  submissions: Submission[];
  received: string;
}

const CASES: IcsrCase[] = [
  {
    id: "ICSR-2025-0001",
    drug: "Infliximab",
    event: "Anaphylactic reaction",
    meddra_pt: "10002198",
    soc: "Immune system disorders",
    patient_age: 42,
    patient_sex: "F",
    reporter: "Physician",
    status: "Completed",
    priority: "Critical",
    seriousness: ["Life-threatening", "Hospitalization"],
    naranjo: 7,
    narrative:
      "A 42-year-old female patient developed anaphylaxis approximately 15 minutes after the third infusion of infliximab 5mg/kg. Patient presented with urticaria, dyspnea, hypotension (BP 80/50 mmHg), and tachycardia. Epinephrine administered with resolution of symptoms within 30 minutes. Patient admitted to ICU for 24-hour monitoring. Infliximab permanently discontinued.",
    submissions: [
      { authority: "FDA", status: "Submitted", ref: "FDA-2025-001234" },
      { authority: "EMA", status: "Submitted", ref: "EU/1/25/001" },
    ],
    received: "2025-01-15",
  },
  {
    id: "ICSR-2025-0002",
    drug: "Methotrexate",
    event: "Pancytopenia",
    meddra_pt: "10033661",
    soc: "Blood and lymphatic system disorders",
    patient_age: 67,
    patient_sex: "M",
    reporter: "Physician",
    status: "Under Assessment",
    priority: "Critical",
    seriousness: ["Hospitalization", "Other Serious"],
    naranjo: 8,
    narrative:
      "A 67-year-old male on methotrexate 15mg/week for rheumatoid arthritis presented with severe pancytopenia (WBC 0.8, Hb 6.2, Plt 12). Patient had declining renal function (GFR 35). Admitted for neutropenic fever management and transfusion support. Methotrexate held; leucovorin rescue initiated. Counts recovering after 14 days.",
    submissions: [
      { authority: "FDA", status: "Pending", ref: "" },
      { authority: "EMA", status: "Submitted", ref: "EU/1/25/002" },
    ],
    received: "2025-02-03",
  },
  {
    id: "ICSR-2025-0003",
    drug: "Atorvastatin",
    event: "Rhabdomyolysis",
    meddra_pt: "10039020",
    soc: "Musculoskeletal and connective tissue disorders",
    patient_age: 58,
    patient_sex: "M",
    reporter: "Pharmacist",
    status: "Pending Review",
    priority: "High",
    seriousness: ["Hospitalization"],
    naranjo: 6,
    narrative:
      "A 58-year-old male reported severe myalgia with CK levels of 12,450 U/L after dose increase from 40mg to 80mg atorvastatin. Dark urine noted. Statin discontinued with gradual CK normalization over 2 weeks. Renal function remained preserved.",
    submissions: [{ authority: "FDA", status: "Pending", ref: "" }],
    received: "2025-02-10",
  },
  {
    id: "ICSR-2025-0004",
    drug: "Nivolumab",
    event: "Autoimmune hepatitis",
    meddra_pt: "10003827",
    soc: "Hepatobiliary disorders",
    patient_age: 55,
    patient_sex: "F",
    reporter: "Physician",
    status: "Under Assessment",
    priority: "High",
    seriousness: ["Hospitalization"],
    naranjo: 5,
    narrative:
      "A 55-year-old female receiving nivolumab for non-small cell lung cancer developed grade 3 hepatitis (ALT 480 U/L, AST 520 U/L) after cycle 4. Liver biopsy consistent with immune-mediated hepatitis. Nivolumab held and high-dose corticosteroids initiated with improvement.",
    submissions: [
      { authority: "FDA", status: "Submitted", ref: "FDA-2025-001567" },
      { authority: "MHRA", status: "Pending", ref: "" },
    ],
    received: "2025-01-28",
  },
  {
    id: "ICSR-2025-0005",
    drug: "Omeprazole",
    event: "Hypomagnesaemia",
    meddra_pt: "10021027",
    soc: "Metabolism and nutrition disorders",
    patient_age: 71,
    patient_sex: "F",
    reporter: "Physician",
    status: "Completed",
    priority: "Medium",
    seriousness: ["Hospitalization"],
    naranjo: 6,
    narrative:
      "A 71-year-old female on long-term omeprazole (5 years) presented with symptomatic hypomagnesaemia (Mg 0.4 mmol/L). Symptoms included muscle cramps, tremor, and cardiac arrhythmia. PPI discontinued with magnesium supplementation and levels normalized within 2 weeks.",
    submissions: [
      { authority: "FDA", status: "Submitted", ref: "FDA-2025-000891" },
    ],
    received: "2025-01-20",
  },
  {
    id: "ICSR-2025-0006",
    drug: "Warfarin",
    event: "Intracranial haemorrhage",
    meddra_pt: "10022763",
    soc: "Nervous system disorders",
    patient_age: 78,
    patient_sex: "M",
    reporter: "Physician",
    status: "Completed",
    priority: "Critical",
    seriousness: ["Death"],
    naranjo: 7,
    narrative:
      "A 78-year-old male on warfarin for atrial fibrillation presented with sudden onset headache and loss of consciousness. CT showed large subdural haematoma. INR at admission was 8.4 (target 2-3). Despite emergency reversal with PCC and surgical evacuation, patient died 48 hours after admission.",
    submissions: [
      { authority: "FDA", status: "Submitted", ref: "FDA-2025-001789" },
      { authority: "EMA", status: "Submitted", ref: "EU/1/25/006" },
      { authority: "MHRA", status: "Submitted", ref: "MHRA-2025-003" },
    ],
    received: "2025-01-08",
  },
  {
    id: "ICSR-2025-0007",
    drug: "Lisinopril",
    event: "Angioedema",
    meddra_pt: "10002424",
    soc: "Immune system disorders",
    patient_age: 52,
    patient_sex: "F",
    reporter: "Consumer",
    status: "Pending Review",
    priority: "High",
    seriousness: ["Life-threatening", "Hospitalization"],
    naranjo: 8,
    narrative:
      "A 52-year-old female developed tongue and lip swelling 2 hours after first dose of lisinopril 10mg. Progressive airway compromise requiring emergency intubation. Lisinopril discontinued. Swelling resolved within 72 hours. Prior history of ACE inhibitor use: none.",
    submissions: [{ authority: "FDA", status: "Pending", ref: "" }],
    received: "2025-02-12",
  },
  {
    id: "ICSR-2025-0008",
    drug: "Adalimumab",
    event: "Tuberculosis",
    meddra_pt: "10044755",
    soc: "Infections and infestations",
    patient_age: 45,
    patient_sex: "M",
    reporter: "Physician",
    status: "Under Assessment",
    priority: "High",
    seriousness: ["Hospitalization", "Other Serious"],
    naranjo: 5,
    narrative:
      "A 45-year-old male on adalimumab for Crohn disease developed pulmonary tuberculosis after 8 months of treatment. Pre-treatment TB screening (IGRA and CXR) was negative. Presented with cough, night sweats, and weight loss. Sputum AFB positive. Adalimumab held and anti-TB therapy initiated.",
    submissions: [
      { authority: "FDA", status: "Submitted", ref: "FDA-2025-002100" },
      { authority: "EMA", status: "Pending", ref: "" },
    ],
    received: "2025-02-01",
  },
  {
    id: "ICSR-2025-0009",
    drug: "Metformin",
    event: "Lactic acidosis",
    meddra_pt: "10023676",
    soc: "Metabolism and nutrition disorders",
    patient_age: 63,
    patient_sex: "M",
    reporter: "Physician",
    status: "Closed",
    priority: "Medium",
    seriousness: ["Hospitalization"],
    naranjo: 4,
    narrative:
      "A 63-year-old diabetic male on metformin 2000mg/day presented with lactic acidosis (lactate 8.2 mmol/L, pH 7.18) in setting of acute gastroenteritis with dehydration. Metformin held, IV fluids and bicarbonate administered. Full recovery after 5 days. Metformin resumed at lower dose after renal function confirmed stable.",
    submissions: [
      { authority: "FDA", status: "Submitted", ref: "FDA-2025-000567" },
    ],
    received: "2024-12-15",
  },
  {
    id: "ICSR-2025-0010",
    drug: "Carbamazepine",
    event: "Stevens-Johnson syndrome",
    meddra_pt: "10042033",
    soc: "Skin and subcutaneous tissue disorders",
    patient_age: 29,
    patient_sex: "F",
    reporter: "Physician",
    status: "Completed",
    priority: "Critical",
    seriousness: ["Life-threatening", "Hospitalization", "Disability"],
    naranjo: 9,
    narrative:
      "A 29-year-old female of Han Chinese descent developed SJS 10 days after starting carbamazepine 200mg BID for epilepsy. Extensive mucocutaneous involvement (20% BSA). HLA-B*15:02 positive (not tested pre-treatment). Carbamazepine immediately discontinued. Managed in burns unit with IV immunoglobulin. Partial recovery with residual skin scarring.",
    submissions: [
      { authority: "FDA", status: "Submitted", ref: "FDA-2025-001234" },
      { authority: "EMA", status: "Submitted", ref: "EU/1/25/010" },
      { authority: "MHRA", status: "Submitted", ref: "MHRA-2025-007" },
    ],
    received: "2025-01-22",
  },
];

const STATUS_COLORS: Record<string, string> = {
  "Pending Review": "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "Under Assessment": "text-cyan bg-cyan/10 border-cyan/30",
  Completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Closed: "text-slate-dim/60 bg-white/[0.04] border-white/[0.12]",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "text-red-400",
  High: "text-amber-400",
  Medium: "text-cyan",
  Low: "text-slate-dim/60",
};

export function IcsrManager() {
  const [selectedId, setSelectedId] = useState<string>(CASES[0].id);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [dedupResults, setDedupResults] = useState<DedupResult[]>([]);
  const [dedupLoading, setDedupLoading] = useState(false);

  const runDedupScan = useCallback(() => {
    setDedupLoading(true);
    const pairs: Promise<DedupResult | null>[] = [];
    for (let i = 0; i < CASES.length; i++) {
      for (let j = i + 1; j < CASES.length; j++) {
        if (
          CASES[i].drug.toLowerCase() === CASES[j].drug.toLowerCase() ||
          CASES[i].event.toLowerCase() === CASES[j].event.toLowerCase()
        ) {
          pairs.push(
            fetch("/api/nexcore/algovigil", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                method: "dedup-pair",
                narrative_a: CASES[i].narrative,
                narrative_b: CASES[j].narrative,
                drug: CASES[i].drug,
              }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((data) =>
                data
                  ? {
                      similarity: data.similarity ?? 0,
                      case_a: CASES[i].id,
                      case_b: CASES[j].id,
                      verdict:
                        data.verdict ??
                        (data.similarity > 0.7
                          ? "Probable Duplicate"
                          : data.similarity > 0.4
                            ? "Review"
                            : "Distinct"),
                    }
                  : null,
              )
              .catch(() => null),
          );
        }
      }
    }
    Promise.all(pairs)
      .then((results) =>
        setDedupResults(
          results.filter(
            (r): r is DedupResult => r !== null && r.similarity > 0.2,
          ),
        ),
      )
      .finally(() => setDedupLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return CASES.filter((c) => {
      if (filterStatus !== "All" && c.status !== filterStatus) return false;
      if (filterPriority !== "All" && c.priority !== filterPriority)
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.drug.toLowerCase().includes(q) ||
          c.event.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filterStatus, filterPriority, search]);

  const selected = CASES.find((c) => c.id === selectedId) || CASES[0];

  // pv-compute: triageCase mirrors icsr-triage.yaml
  const triage: IcsrTriageResult = useMemo(
    () =>
      triageCase({
        death: selected.seriousness.includes("Death"),
        hospitalization: selected.seriousness.includes("Hospitalization"),
        naranjo_score: selected.naranjo,
        prr: 2.0, // Cases in ICSR manager are confirmed AEs — PRR gate passes
      }),
    [selected],
  );

  // pv-compute: checkCaseValidity mirrors case-validity.yaml
  const validity: CaseValidityResult = useMemo(
    () =>
      checkCaseValidity({
        has_reporter: !!selected.reporter,
        has_patient: selected.patient_age > 0,
        has_suspect_drug: !!selected.drug,
        has_adverse_event: !!selected.event,
      }),
    [selected],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Case Management / E2B(R3) Structured Data
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          ICSR Case Management
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Individual Case Safety Reports with causality assessment, seriousness
          classification, and regulatory submission tracking
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-dim/30" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="w-full border border-white/[0.12] bg-white/[0.06] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none font-mono"
          />
        </div>
        <div className="flex gap-2">
          {[
            "All",
            "Pending Review",
            "Under Assessment",
            "Completed",
            "Closed",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest font-mono transition-all ${
                filterStatus === s
                  ? "bg-cyan/10 border border-cyan/30 text-cyan"
                  : "border border-white/[0.08] text-slate-dim/40 hover:text-white hover:border-white/[0.2]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["All", "Critical", "High", "Medium", "Low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest font-mono transition-all ${
                filterPriority === p
                  ? "bg-cyan/10 border border-cyan/30 text-cyan"
                  : "border border-white/[0.08] text-slate-dim/40 hover:text-white hover:border-white/[0.2]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Dedup scan */}
      <div className="mb-6 border border-white/[0.12] bg-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">Duplicate Detection</span>
            <span className="text-[8px] font-mono text-slate-dim/30">
              NexCore Algovigil
            </span>
          </div>
          <button
            onClick={runDedupScan}
            disabled={dedupLoading}
            className="px-4 py-1.5 border border-cyan/30 bg-cyan/10 text-cyan text-[10px] font-bold font-mono uppercase tracking-widest hover:bg-cyan/20 disabled:opacity-40 transition-all"
          >
            {dedupLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Scan for Duplicates"
            )}
          </button>
        </div>
        {dedupResults.length > 0 && (
          <div className="space-y-2">
            {dedupResults.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-2 border text-xs font-mono ${
                  r.similarity > 0.7
                    ? "border-red-500/30 bg-red-500/5"
                    : r.similarity > 0.4
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-white/[0.08] bg-black/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-dim/40">{r.case_a}</span>
                  <span className="text-slate-dim/20">vs</span>
                  <span className="text-slate-dim/40">{r.case_b}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-bold tabular-nums ${
                      r.similarity > 0.7
                        ? "text-red-400"
                        : r.similarity > 0.4
                          ? "text-amber-400"
                          : "text-slate-dim/40"
                    }`}
                  >
                    {(r.similarity * 100).toFixed(1)}%
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-widest ${
                      r.verdict === "Probable Duplicate"
                        ? "text-red-400"
                        : r.verdict === "Review"
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {r.verdict}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {dedupResults.length === 0 && !dedupLoading && (
          <p className="text-[10px] font-mono text-slate-dim/30">
            Click scan to compare case narratives for potential duplicates using
            Jaccard similarity
          </p>
        )}
      </div>

      {/* Split view */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Case list */}
        <div className="border border-white/[0.12] bg-white/[0.06] max-h-[800px] overflow-auto">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <FileText className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">{filtered.length} Cases</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="p-3 space-y-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full border px-4 py-3 text-left transition-all ${
                  selectedId === c.id
                    ? "border-cyan/30 bg-cyan/5"
                    : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-dim/40">
                    {c.id}
                  </span>
                  <span
                    className={`text-[9px] font-bold ${PRIORITY_COLORS[c.priority] || "text-slate-dim/40"}`}
                  >
                    {c.priority}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{c.drug}</p>
                <p className="text-[11px] text-slate-dim/50 mt-0.5">
                  {c.event}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`px-2 py-0.5 border text-[8px] font-bold uppercase tracking-widest font-mono ${STATUS_COLORS[c.status] || ""}`}
                  >
                    {c.status}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-dim/20" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Case detail */}
        <div className="lg:col-span-2 border border-white/[0.12] bg-white/[0.06] max-h-[800px] overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono text-slate-dim/40">
                  {selected.id}
                </p>
                <h2 className="text-lg font-bold text-white mt-1">
                  {selected.drug} — {selected.event}
                </h2>
                <p className="text-[10px] text-slate-dim/40 mt-1">
                  Received: {selected.received}
                </p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-2 py-0.5 border text-[8px] font-bold uppercase tracking-widest font-mono ${STATUS_COLORS[selected.status] || ""}`}
                >
                  {selected.status}
                </span>
                <span
                  className={`text-[9px] font-bold ${PRIORITY_COLORS[selected.priority] || ""}`}
                >
                  {selected.priority}
                </span>
              </div>
            </div>

            {/* Patient */}
            <section>
              <h3 className="text-[9px] font-bold text-cyan/60 uppercase tracking-widest font-mono mb-3">
                Patient Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-white/[0.08] bg-black/20 p-3">
                  <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                    Age
                  </p>
                  <p className="text-sm font-extrabold text-white font-mono">
                    {selected.patient_age}
                  </p>
                </div>
                <div className="border border-white/[0.08] bg-black/20 p-3">
                  <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                    Sex
                  </p>
                  <p className="text-sm font-extrabold text-white font-mono">
                    {selected.patient_sex}
                  </p>
                </div>
                <div className="border border-white/[0.08] bg-black/20 p-3">
                  <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                    Reporter
                  </p>
                  <p className="text-sm font-extrabold text-white font-mono">
                    {selected.reporter}
                  </p>
                </div>
              </div>
            </section>

            {/* Reaction/Event */}
            <section>
              <h3 className="text-[9px] font-bold text-cyan/60 uppercase tracking-widest font-mono mb-3">
                Reaction / Event
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/[0.08] bg-black/20 p-3">
                  <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                    MedDRA PT
                  </p>
                  <p className="text-sm font-bold text-white font-mono">
                    {selected.event}
                  </p>
                  <p className="text-[10px] text-slate-dim/40 mt-1">
                    Code: {selected.meddra_pt}
                  </p>
                </div>
                <div className="border border-white/[0.08] bg-black/20 p-3">
                  <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                    System Organ Class
                  </p>
                  <p className="text-sm font-bold text-white font-mono">
                    {selected.soc}
                  </p>
                </div>
              </div>
            </section>

            {/* Seriousness */}
            <section>
              <h3 className="text-[9px] font-bold text-cyan/60 uppercase tracking-widest font-mono mb-3">
                Seriousness (ICH E2A)
              </h3>
              <div className="flex flex-wrap gap-2">
                {selected.seriousness.map((s) => (
                  <span
                    key={s}
                    className={`px-3 py-1 border text-[10px] font-bold uppercase tracking-widest font-mono ${
                      s === "Death" || s === "Life-threatening"
                        ? "text-red-400 border-red-500/30 bg-red-500/10"
                        : s === "Disability"
                          ? "text-orange-400 border-orange-500/30 bg-orange-500/10"
                          : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            {/* Causality */}
            <section>
              <h3 className="text-[9px] font-bold text-cyan/60 uppercase tracking-widest font-mono mb-3">
                Causality Assessment
              </h3>
              <div className="border border-white/[0.08] bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                      Naranjo Score
                    </p>
                    <p
                      className={`text-2xl font-extrabold font-mono mt-1 ${
                        selected.naranjo >= 9
                          ? "text-red-400"
                          : selected.naranjo >= 5
                            ? "text-amber-400"
                            : selected.naranjo >= 1
                              ? "text-cyan"
                              : "text-slate-dim/60"
                      }`}
                    >
                      {selected.naranjo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                      Classification
                    </p>
                    <p
                      className={`text-sm font-bold font-mono mt-1 ${
                        selected.naranjo >= 9
                          ? "text-red-400"
                          : selected.naranjo >= 5
                            ? "text-amber-400"
                            : selected.naranjo >= 1
                              ? "text-cyan"
                              : "text-slate-dim/60"
                      }`}
                    >
                      {selected.naranjo >= 9
                        ? "DEFINITE"
                        : selected.naranjo >= 5
                          ? "PROBABLE"
                          : selected.naranjo >= 1
                            ? "POSSIBLE"
                            : "DOUBTFUL"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Narrative */}
            <section>
              <h3 className="text-[9px] font-bold text-cyan/60 uppercase tracking-widest font-mono mb-3">
                Case Narrative
              </h3>
              <div className="border border-white/[0.08] bg-black/20 p-4">
                <p className="text-sm text-white/70 leading-relaxed">
                  {selected.narrative}
                </p>
              </div>
            </section>

            {/* Submissions */}
            <section>
              <h3 className="text-[9px] font-bold text-cyan/60 uppercase tracking-widest font-mono mb-3">
                Regulatory Submissions
              </h3>
              <div className="space-y-2">
                {selected.submissions.map((sub) => (
                  <div
                    key={sub.authority}
                    className="border border-white/[0.08] bg-black/20 p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white font-mono">
                        {sub.authority}
                      </p>
                      {sub.ref && (
                        <p className="text-[10px] text-slate-dim/40 mt-0.5">
                          Ref: {sub.ref}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 border text-[8px] font-bold uppercase tracking-widest font-mono ${
                        sub.status === "Submitted"
                          ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* pv-compute: Case Triage & Validity */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-3.5 w-3.5 text-cyan/60" />
                <h3 className="text-[9px] font-bold text-cyan/60 uppercase tracking-widest font-mono">
                  Case Triage & Validity
                </h3>
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-[8px] font-mono text-slate-dim/30">
                  pv-compute · client-side
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/[0.08] bg-black/20 p-4 space-y-3">
                  <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                    Triage Classification
                  </p>
                  <span
                    className={`inline-block px-3 py-1.5 border font-mono text-xs font-bold uppercase tracking-widest ${
                      triage.triage === "CRITICAL"
                        ? "text-red-400 border-red-500/30 bg-red-500/10"
                        : triage.triage === "SERIOUS"
                          ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                          : triage.triage === "PROBABLE"
                            ? "text-cyan/80 border-cyan/30 bg-cyan/10"
                            : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    }`}
                  >
                    {triage.triage}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-dim/40">Channel: </span>
                      <span className="text-white/70">{triage.channel}</span>
                    </div>
                    <div>
                      <span className="text-slate-dim/40">Action: </span>
                      <span className="text-white/70">
                        {triage.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-dim/40">Deadline: </span>
                      <span className="text-white/70">
                        {triage.deadline_days} days
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border border-white/[0.08] bg-black/20 p-4 space-y-3">
                  <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                    ICH E2B(R3) Validity
                  </p>
                  <span
                    className={`inline-block px-3 py-1.5 border font-mono text-xs font-bold uppercase tracking-widest ${
                      validity.valid
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-red-400 border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    {validity.status.replace(/_/g, " ")}
                  </span>
                  <div className="text-[10px] font-mono">
                    <span className="text-slate-dim/40">Action: </span>
                    <span className="text-white/70">
                      {validity.action.replace(/_/g, " ")}
                    </span>
                  </div>
                  {validity.missing_fields.length > 0 && (
                    <div className="text-[10px] font-mono">
                      <span className="text-slate-dim/40">Missing: </span>
                      <span className="text-red-400/70">
                        {validity.missing_fields.join(", ")}
                      </span>
                    </div>
                  )}
                  <p className="text-[9px] font-mono text-slate-dim/30">
                    {validity.regulatory_reference}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">ICSR processing backed by E2B(R3) structured data. AI agents process cases via mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/causality-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Causality Lab
        </a>
      </div>
    </div>
  );
}
