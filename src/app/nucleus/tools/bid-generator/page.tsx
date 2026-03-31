"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Building2,
  Activity,
  Target,
  Clock,
  ChevronRight,
  ChevronLeft,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
} from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompanyProfile {
  name: string;
  size: "startup" | "small" | "mid" | "large" | "enterprise" | "";
  therapeuticAreas: string[];
  markets: string[];
  currentPvSystem: "none" | "basic" | "established" | "mature" | "";
}

interface MaturityScores {
  signalDetection: number;
  causalityAssessment: number;
  regulatoryReporting: number;
  riskManagement: number;
  dataManagement: number;
  qualitySystem: number;
}

interface ScopeSelection {
  services: string[];
  priorities: string[];
  constraints: string[];
}

interface Timeline {
  urgency: "standard" | "expedited" | "urgent";
  startDate: string;
  budgetRange:
    | "under50k"
    | "50to100k"
    | "100to250k"
    | "250to500k"
    | "over500k"
    | "";
  duration: "project" | "quarterly" | "annual" | "ongoing" | "";
}

interface RfpData {
  company: CompanyProfile;
  maturity: MaturityScores;
  scope: ScopeSelection;
  timeline: Timeline;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COMPANY_SIZES = [
  { value: "startup", label: "Startup (<50 employees)" },
  { value: "small", label: "Small (50–200)" },
  { value: "mid", label: "Mid-market (200–1,000)" },
  { value: "large", label: "Large (1,000–10,000)" },
  { value: "enterprise", label: "Enterprise (10,000+)" },
] as const;

const THERAPEUTIC_AREAS = [
  "Oncology",
  "Immunology",
  "Neurology",
  "Cardiovascular",
  "Metabolic/Endocrine",
  "Rare Disease",
  "Infectious Disease",
  "Respiratory",
  "Dermatology",
  "Ophthalmology",
  "Gene/Cell Therapy",
  "Vaccines",
] as const;

const MARKETS = [
  "United States",
  "European Union",
  "United Kingdom",
  "Japan",
  "China",
  "Canada",
  "Australia",
  "Rest of World",
] as const;

const PV_SYSTEM_LEVELS = [
  { value: "none", label: "No formal PV system", color: "text-red-400" },
  {
    value: "basic",
    label: "Basic (ad hoc processes)",
    color: "text-amber-400",
  },
  {
    value: "established",
    label: "Established (SOPs, dedicated team)",
    color: "text-cyan",
  },
  {
    value: "mature",
    label: "Mature (automated, continuous improvement)",
    color: "text-emerald-400",
  },
] as const;

const SERVICES = [
  {
    id: "signal-detection",
    label: "Signal Detection & FAERS Mining",
    description:
      "Automated disproportionality analysis, EBGM/PRR/ROR screening",
    hours: { min: 40, max: 120 },
    rate: 275,
  },
  {
    id: "causality-assessment",
    label: "Causality Assessment",
    description: "Naranjo, WHO-UMC, Bradford Hill criteria application",
    hours: { min: 20, max: 60 },
    rate: 300,
  },
  {
    id: "benefit-risk",
    label: "Benefit-Risk Evaluation",
    description:
      "QBRI scoring, therapeutic window analysis, comparator profiling",
    hours: { min: 30, max: 80 },
    rate: 300,
  },
  {
    id: "psur-pbrer",
    label: "PSUR/PBRER Preparation",
    description:
      "Periodic safety update reports, benefit-risk sections, signal summaries",
    hours: { min: 60, max: 200 },
    rate: 275,
  },
  {
    id: "rmp",
    label: "Risk Management Planning",
    description:
      "Safety specification, pharmacovigilance plan, risk minimization",
    hours: { min: 40, max: 120 },
    rate: 275,
  },
  {
    id: "system-audit",
    label: "PV System Setup & Audit",
    description:
      "GVP compliance gap analysis, SOP development, system validation",
    hours: { min: 80, max: 240 },
    rate: 250,
  },
  {
    id: "regulatory-strategy",
    label: "Regulatory Strategy",
    description:
      "ICH guideline interpretation, submission strategy, authority interactions",
    hours: { min: 20, max: 60 },
    rate: 325,
  },
  {
    id: "ai-pv",
    label: "AI/ML in Pharmacovigilance",
    description:
      "Automated case processing, NLP extraction, algorithmovigilance",
    hours: { min: 40, max: 160 },
    rate: 325,
  },
] as const;

const PRIORITIES = [
  "Reduce time-to-signal",
  "Improve regulatory compliance",
  "Automate manual processes",
  "Prepare for inspection",
  "Scale PV operations",
  "Implement AI/ML capabilities",
  "Reduce outsourcing costs",
  "Improve data quality",
] as const;

const CONSTRAINTS = [
  "Limited internal PV expertise",
  "Legacy IT systems",
  "Upcoming regulatory deadline",
  "Budget already allocated for FY",
  "Multi-region coordination needed",
  "Board/investor visibility required",
] as const;

const BUDGET_RANGES = [
  { value: "under50k", label: "Under $50,000" },
  { value: "50to100k", label: "$50,000 – $100,000" },
  { value: "100to250k", label: "$100,000 – $250,000" },
  { value: "250to500k", label: "$250,000 – $500,000" },
  { value: "over500k", label: "$500,000+" },
] as const;

const DURATION_OPTIONS = [
  { value: "project", label: "Fixed project (1–3 months)" },
  { value: "quarterly", label: "Quarterly engagement" },
  { value: "annual", label: "Annual retainer" },
  { value: "ongoing", label: "Ongoing partnership" },
] as const;

const STEPS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "maturity", label: "Maturity", icon: Activity },
  { id: "scope", label: "Scope", icon: Target },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "proposal", label: "Proposal", icon: FileText },
] as const;

// ─── Initial State ──────────────────────────────────────────────────────────

const INITIAL_DATA: RfpData = {
  company: {
    name: "",
    size: "",
    therapeuticAreas: [],
    markets: [],
    currentPvSystem: "",
  },
  maturity: {
    signalDetection: 0,
    causalityAssessment: 0,
    regulatoryReporting: 0,
    riskManagement: 0,
    dataManagement: 0,
    qualitySystem: 0,
  },
  scope: {
    services: [],
    priorities: [],
    constraints: [],
  },
  timeline: {
    urgency: "standard",
    startDate: "",
    budgetRange: "",
    duration: "",
  },
};

// ─── Proposal Engine ────────────────────────────────────────────────────────

interface ProposalLine {
  service: string;
  description: string;
  estimatedHours: number;
  rate: number;
  total: number;
}

interface Proposal {
  engagementType: string;
  lines: ProposalLine[];
  totalHours: number;
  totalCost: number;
  maturityScore: number;
  gapAreas: string[];
  deliverables: string[];
  nexvigilantTools: string[];
  timeline: string;
  discountPct: number;
  discountedTotal: number;
}

function generateProposal(data: RfpData): Proposal {
  const { company, maturity, scope, timeline } = data;

  // Maturity score (0-100)
  const scores = Object.values(maturity);
  const maturityScore = Math.round(
    (scores.reduce((a, b) => a + b, 0) / (scores.length * 5)) * 100,
  );

  // Identify gap areas (score < 3)
  const maturityLabels: Record<string, string> = {
    signalDetection: "Signal Detection",
    causalityAssessment: "Causality Assessment",
    regulatoryReporting: "Regulatory Reporting",
    riskManagement: "Risk Management",
    dataManagement: "Data Management",
    qualitySystem: "Quality System",
  };
  const gapAreas = Object.entries(maturity)
    .filter(([, v]) => v < 3)
    .map(([k]) => maturityLabels[k] || k);

  // Build line items from selected services
  const urgencyMultiplier =
    timeline.urgency === "urgent"
      ? 1.3
      : timeline.urgency === "expedited"
        ? 1.15
        : 1.0;

  const sizeMultiplier =
    company.size === "enterprise"
      ? 1.4
      : company.size === "large"
        ? 1.2
        : company.size === "mid"
          ? 1.0
          : company.size === "small"
            ? 0.8
            : 0.6;

  const marketMultiplier = Math.max(
    1.0,
    1 + (company.markets.length - 1) * 0.1,
  );

  const lines: ProposalLine[] = scope.services
    .map((serviceId): ProposalLine | null => {
      const service = SERVICES.find((s) => s.id === serviceId);
      if (!service) return null;

      // Scale hours based on company size and market complexity
      const baseHours = Math.round(
        ((service.hours.min + service.hours.max) / 2) *
          sizeMultiplier *
          marketMultiplier,
      );
      const rate = Math.round(service.rate * urgencyMultiplier);
      return {
        service: String(service.label),
        description: String(service.description),
        estimatedHours: baseHours,
        rate,
        total: baseHours * rate,
      };
    })
    .filter((l): l is ProposalLine => l !== null);

  const totalHours = lines.reduce((s, l) => s + l.estimatedHours, 0);
  const totalCost = lines.reduce((s, l) => s + l.total, 0);

  // Volume discount
  const discountPct =
    totalHours > 500 ? 15 : totalHours > 200 ? 10 : totalHours > 100 ? 5 : 0;
  const discountedTotal = Math.round(totalCost * (1 - discountPct / 100));

  // Engagement type
  const engagementType =
    timeline.duration === "ongoing" || timeline.duration === "annual"
      ? "Strategic Partnership"
      : totalHours > 200
        ? "Enterprise Engagement"
        : totalHours > 80
          ? "Project Engagement"
          : "Advisory Engagement";

  // Deliverables based on services
  const deliverables: string[] = [];
  if (scope.services.includes("signal-detection"))
    deliverables.push(
      "Disproportionality analysis report (PRR/ROR/EBGM/IC)",
      "Signal prioritization matrix with SUSE verdicts",
    );
  if (scope.services.includes("causality-assessment"))
    deliverables.push(
      "Causality assessment report (Naranjo + WHO-UMC)",
      "Bradford Hill evidence evaluation",
    );
  if (scope.services.includes("benefit-risk"))
    deliverables.push(
      "QBRI benefit-risk assessment",
      "Therapeutic window analysis with comparators",
    );
  if (scope.services.includes("psur-pbrer"))
    deliverables.push(
      "Complete PSUR/PBRER document",
      "Signal summary and benefit-risk sections",
    );
  if (scope.services.includes("rmp"))
    deliverables.push(
      "Risk Management Plan (EU RMP format)",
      "Safety specification and pharmacovigilance plan",
    );
  if (scope.services.includes("system-audit"))
    deliverables.push(
      "GVP compliance gap analysis report",
      "SOP development roadmap with templates",
    );
  if (scope.services.includes("regulatory-strategy"))
    deliverables.push(
      "Regulatory strategy document",
      "Authority interaction preparation brief",
    );
  if (scope.services.includes("ai-pv"))
    deliverables.push(
      "AI/ML implementation roadmap",
      "Pilot deployment with validation report",
    );
  deliverables.push(
    "Executive summary presentation",
    "Knowledge transfer sessions",
  );

  // AlgoVigilance tools mapped to services
  const toolMap: Record<string, string[]> = {
    "signal-detection": [
      "FAERS Signal Explorer",
      "Disproportionality Calculator (PRR/ROR/IC/EBGM)",
      "SUSE Verdict Engine",
    ],
    "causality-assessment": [
      "Naranjo Quick Assessor",
      "WHO-UMC Causality Tool",
      "Bradford Hill Evidence Network",
    ],
    "benefit-risk": [
      "QBRI Calculator",
      "Therapeutic Window Analyzer",
      "Benefit-Risk Observatory",
    ],
    "psur-pbrer": [
      "Signal Summary Generator",
      "FAERS Time-Series Analytics",
      "DailyMed Label Cross-Reference",
    ],
    rmp: [
      "Risk Score Calculator",
      "Harm Taxonomy Classifier",
      "Safety Margin Analyzer",
    ],
    "system-audit": [
      "ICH Compliance Checker",
      "GVP Gap Analyzer",
      "PV System Maturity Assessment",
    ],
    "regulatory-strategy": [
      "ICH Guideline Navigator (2,794 docs)",
      "EMA EPAR Explorer",
      "FDA Approval History Tracker",
    ],
    "ai-pv": [
      "Algorithmovigilance Platform",
      "ICSR Deduplication Engine",
      "Triage Queue with Decay Modeling",
    ],
  };

  const nexvigilantTools = [
    ...new Set(scope.services.flatMap((s) => toolMap[s] || [])),
  ];

  // Timeline estimate
  const weeksEstimate = Math.max(4, Math.ceil(totalHours / 40));
  const timelineStr =
    timeline.urgency === "urgent"
      ? `${Math.ceil(weeksEstimate * 0.6)} weeks (expedited)`
      : timeline.urgency === "expedited"
        ? `${Math.ceil(weeksEstimate * 0.8)} weeks`
        : `${weeksEstimate} weeks`;

  return {
    engagementType,
    lines,
    totalHours,
    totalCost,
    maturityScore,
    gapAreas,
    deliverables,
    nexvigilantTools,
    timeline: timelineStr,
    discountPct,
    discountedTotal,
  };
}

// ─── Components ─────────────────────────────────────────────────────────────

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-cyan/40 bg-cyan/10 text-cyan"
          : "border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function SliderField({
  label,
  value,
  onChange,
  labels,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  labels: string[];
}) {
  const colors = [
    "text-red-400",
    "text-orange-400",
    "text-amber-400",
    "text-cyan",
    "text-emerald-400",
    "text-emerald-300",
  ];
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs text-slate-400">{label}</label>
        <span className={`text-xs font-medium ${colors[value]}`}>
          {labels[value]}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

// ─── Step Components ────────────────────────────────────────────────────────

function CompanyStep({
  data,
  onChange,
}: {
  data: CompanyProfile;
  onChange: (d: CompanyProfile) => void;
}) {
  const toggle = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-xs text-slate-400">
          Company Name
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Acme Pharmaceuticals"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan/40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">
          Company Size
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COMPANY_SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ ...data, size: s.value })}
              className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                data.size === s.value
                  ? "border-cyan/40 bg-cyan/10 text-cyan"
                  : "border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">
          Therapeutic Areas
        </label>
        <div className="flex flex-wrap gap-2">
          {THERAPEUTIC_AREAS.map((area) => (
            <ToggleChip
              key={area}
              label={area}
              selected={data.therapeuticAreas.includes(area)}
              onClick={() =>
                onChange({
                  ...data,
                  therapeuticAreas: toggle(data.therapeuticAreas, area),
                })
              }
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">
          Markets (regulatory jurisdictions)
        </label>
        <div className="flex flex-wrap gap-2">
          {MARKETS.map((m) => (
            <ToggleChip
              key={m}
              label={m}
              selected={data.markets.includes(m)}
              onClick={() =>
                onChange({ ...data, markets: toggle(data.markets, m) })
              }
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">
          Current PV System Maturity
        </label>
        <div className="space-y-2">
          {PV_SYSTEM_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() =>
                onChange({ ...data, currentPvSystem: level.value })
              }
              className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                data.currentPvSystem === level.value
                  ? "border-cyan/40 bg-cyan/5"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  data.currentPvSystem === level.value
                    ? "bg-cyan"
                    : "bg-slate-600"
                }`}
              />
              <span
                className={
                  data.currentPvSystem === level.value
                    ? "text-white"
                    : "text-slate-400"
                }
              >
                {level.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MaturityStep({
  data,
  onChange,
}: {
  data: MaturityScores;
  onChange: (d: MaturityScores) => void;
}) {
  const levels = [
    "None",
    "Ad Hoc",
    "Developing",
    "Defined",
    "Managed",
    "Optimized",
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        Rate each capability area from 0 (none) to 5 (optimized). This helps us
        size the engagement and identify gaps.
      </p>
      <SliderField
        label="Signal Detection"
        value={data.signalDetection}
        onChange={(v) => onChange({ ...data, signalDetection: v })}
        labels={levels}
      />
      <SliderField
        label="Causality Assessment"
        value={data.causalityAssessment}
        onChange={(v) => onChange({ ...data, causalityAssessment: v })}
        labels={levels}
      />
      <SliderField
        label="Regulatory Reporting"
        value={data.regulatoryReporting}
        onChange={(v) => onChange({ ...data, regulatoryReporting: v })}
        labels={levels}
      />
      <SliderField
        label="Risk Management"
        value={data.riskManagement}
        onChange={(v) => onChange({ ...data, riskManagement: v })}
        labels={levels}
      />
      <SliderField
        label="Data Management"
        value={data.dataManagement}
        onChange={(v) => onChange({ ...data, dataManagement: v })}
        labels={levels}
      />
      <SliderField
        label="Quality System"
        value={data.qualitySystem}
        onChange={(v) => onChange({ ...data, qualitySystem: v })}
        labels={levels}
      />

      {/* Summary */}
      <div className="rounded-md border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Overall Maturity</span>
          <span className="font-mono text-sm font-bold text-white">
            {Math.round(
              (Object.values(data).reduce((a, b) => a + b, 0) /
                (Object.values(data).length * 5)) *
                100,
            )}
            %
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all"
            style={{
              width: `${Math.round(
                (Object.values(data).reduce((a, b) => a + b, 0) /
                  (Object.values(data).length * 5)) *
                  100,
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ScopeStep({
  data,
  onChange,
}: {
  data: ScopeSelection;
  onChange: (d: ScopeSelection) => void;
}) {
  const toggle = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-xs text-slate-400">
          Services Needed
        </label>
        <div className="space-y-2">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() =>
                onChange({
                  ...data,
                  services: toggle(data.services, service.id),
                })
              }
              className={`flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors ${
                data.services.includes(service.id)
                  ? "border-cyan/40 bg-cyan/5"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  data.services.includes(service.id)
                    ? "border-cyan bg-cyan"
                    : "border-slate-600"
                }`}
              >
                {data.services.includes(service.id) && (
                  <CheckCircle2 className="h-3 w-3 text-black" />
                )}
              </div>
              <div>
                <span
                  className={`text-sm font-medium ${
                    data.services.includes(service.id)
                      ? "text-white"
                      : "text-slate-300"
                  }`}
                >
                  {service.label}
                </span>
                <p className="mt-0.5 text-xs text-slate-500">
                  {service.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs text-slate-400">
          Top Priorities
        </label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <ToggleChip
              key={p}
              label={p}
              selected={data.priorities.includes(p)}
              onClick={() =>
                onChange({
                  ...data,
                  priorities: toggle(data.priorities, p),
                })
              }
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs text-slate-400">
          Known Constraints
        </label>
        <div className="flex flex-wrap gap-2">
          {CONSTRAINTS.map((c) => (
            <ToggleChip
              key={c}
              label={c}
              selected={data.constraints.includes(c)}
              onClick={() =>
                onChange({
                  ...data,
                  constraints: toggle(data.constraints, c),
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineStep({
  data,
  onChange,
}: {
  data: Timeline;
  onChange: (d: Timeline) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-xs text-slate-400">Urgency</label>
        <div className="flex gap-2">
          {(["standard", "expedited", "urgent"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onChange({ ...data, urgency: u })}
              className={`flex-1 rounded-md border px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                data.urgency === u
                  ? u === "urgent"
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : u === "expedited"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : "border-cyan/30 bg-cyan/10 text-cyan"
                  : "border-white/5 text-slate-500 hover:border-white/10"
              }`}
            >
              {u}
              {u === "expedited" && (
                <span className="ml-1 text-[10px]">(+15%)</span>
              )}
              {u === "urgent" && (
                <span className="ml-1 text-[10px]">(+30%)</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">
          Desired Start Date
        </label>
        <input
          type="date"
          value={data.startDate}
          onChange={(e) => onChange({ ...data, startDate: e.target.value })}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan/40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">
          Budget Range
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BUDGET_RANGES.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => onChange({ ...data, budgetRange: b.value })}
              className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                data.budgetRange === b.value
                  ? "border-cyan/40 bg-cyan/10 text-cyan"
                  : "border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">
          Engagement Duration
        </label>
        <div className="space-y-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onChange({ ...data, duration: d.value })}
              className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                data.duration === d.value
                  ? "border-cyan/40 bg-cyan/5 text-white"
                  : "border-white/10 text-slate-400 hover:border-white/20"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  data.duration === d.value ? "bg-cyan" : "bg-slate-600"
                }`}
              />
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProposalView({
  data,
  proposal,
}: {
  data: RfpData;
  proposal: Proposal;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-cyan/20 bg-gradient-to-r from-cyan/5 to-transparent p-6">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan">
          <Sparkles className="h-4 w-4" />
          Generated Proposal
        </div>
        <h3 className="mt-2 text-xl font-bold text-white">
          {proposal.engagementType}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          For {data.company.name || "Your Company"} &middot; {proposal.timeline}{" "}
          estimated duration
        </p>
      </div>

      {/* Maturity Assessment */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
          PV Maturity Assessment
        </h4>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={
                  proposal.maturityScore >= 70
                    ? "#34d399"
                    : proposal.maturityScore >= 40
                      ? "#fbbf24"
                      : "#f87171"
                }
                strokeWidth="3"
                strokeDasharray={`${proposal.maturityScore}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-white">
              {proposal.maturityScore}%
            </span>
          </div>
          <div>
            {proposal.gapAreas.length > 0 ? (
              <>
                <p className="text-sm text-slate-400">
                  Gaps identified in {proposal.gapAreas.length} area
                  {proposal.gapAreas.length !== 1 ? "s" : ""}:
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {proposal.gapAreas.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-emerald-400">
                No critical gaps — optimization engagement
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
          Service Line Items
        </h4>
        <div className="space-y-3">
          {proposal.lines.map((line) => (
            <div
              key={line.service}
              className="flex items-start justify-between rounded-md border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{line.service}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {line.estimatedHours} hrs @ ${line.rate}/hr
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-bold text-white">
                ${line.total.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Hours</span>
            <span className="font-mono text-white">
              {proposal.totalHours} hrs
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Subtotal</span>
            <span className="font-mono text-white">
              ${proposal.totalCost.toLocaleString()}
            </span>
          </div>
          {proposal.discountPct > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-400">
                Volume Discount ({proposal.discountPct}%)
              </span>
              <span className="font-mono text-emerald-400">
                -$
                {(
                  proposal.totalCost - proposal.discountedTotal
                ).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/5 pt-2 text-base">
            <span className="font-medium text-white">Estimated Total</span>
            <span className="font-mono text-lg font-bold text-cyan">
              ${proposal.discountedTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Deliverables */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
          Deliverables
        </h4>
        <ul className="space-y-1.5">
          {proposal.deliverables.map((d) => (
            <li
              key={d}
              className="flex items-start gap-2 text-sm text-slate-300"
            >
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      {/* AlgoVigilance Tools */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
        <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
          AlgoVigilance Tools Deployed
        </h4>
        <div className="flex flex-wrap gap-2">
          {proposal.nexvigilantTools.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-cyan/20 bg-cyan/5 px-2.5 py-1 text-xs text-cyan"
            >
              {tool}
            </span>
          ))}
        </div>
      </div>

      {/* Budget Fit Warning */}
      {data.timeline.budgetRange && (
        <BudgetFitIndicator
          budgetRange={data.timeline.budgetRange}
          proposedTotal={proposal.discountedTotal}
        />
      )}

      {/* Next Steps */}
      <div className="rounded-lg border border-gold/20 bg-gold/5 p-5">
        <h4 className="mb-2 text-sm font-medium text-gold">Next Steps</h4>
        <ol className="space-y-1.5 text-sm text-slate-300">
          <li>1. Review this proposal and adjust scope if needed</li>
          <li>2. Book a 30-minute discovery call to refine requirements</li>
          <li>3. Receive a formal Statement of Work within 48 hours</li>
          <li>
            4. Kick off within{" "}
            {data.timeline.urgency === "urgent" ? "1 week" : "2 weeks"} of
            signing
          </li>
        </ol>
        <Link
          href={`/schedule?topic=${encodeURIComponent(
            data.scope.services
              .map((s) => SERVICES.find((svc) => svc.id === s)?.label)
              .filter(Boolean)
              .join(", "),
          )}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold/90"
        >
          <Calendar className="h-4 w-4" />
          Book Discovery Call
        </Link>
      </div>
    </div>
  );
}

function BudgetFitIndicator({
  budgetRange,
  proposedTotal,
}: {
  budgetRange: string;
  proposedTotal: number;
}) {
  const ranges: Record<string, [number, number]> = {
    under50k: [0, 50000],
    "50to100k": [50000, 100000],
    "100to250k": [100000, 250000],
    "250to500k": [250000, 500000],
    over500k: [500000, Infinity],
  };

  const [min, max] = ranges[budgetRange] || [0, Infinity];
  const fits = proposedTotal >= min && proposedTotal <= max;
  const over = proposedTotal > max;

  if (fits) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Proposal fits within your stated budget range
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-400">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {over
          ? "Proposal exceeds your stated budget. Consider reducing scope or extending the timeline to bring costs down."
          : "Proposal is under your stated budget. Additional services could strengthen your PV program."}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function BidGeneratorPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<RfpData>(INITIAL_DATA);

  const proposal = useMemo(
    () => (step === 4 ? generateProposal(data) : null),
    [step, data],
  );

  const canAdvance = (() => {
    switch (step) {
      case 0:
        return data.company.name && data.company.size;
      case 1:
        return true; // Maturity sliders always have values
      case 2:
        return data.scope.services.length > 0;
      case 3:
        return data.timeline.budgetRange && data.timeline.duration;
      default:
        return false;
    }
  })();

  const handleExportMarkdown = () => {
    if (!proposal) return;
    const md = [
      `# AlgoVigilance Consulting Proposal`,
      `## ${proposal.engagementType}`,
      `**Client:** ${data.company.name || "—"}`,
      `**Date:** ${new Date().toISOString().slice(0, 10)}`,
      `**Estimated Duration:** ${proposal.timeline}`,
      `**PV Maturity Score:** ${proposal.maturityScore}%`,
      "",
      `## Service Line Items`,
      "",
      `| Service | Hours | Rate | Total |`,
      `|---------|-------|------|-------|`,
      ...proposal.lines.map(
        (l) =>
          `| ${l.service} | ${l.estimatedHours} | $${l.rate}/hr | $${l.total.toLocaleString()} |`,
      ),
      "",
      `**Total Hours:** ${proposal.totalHours}`,
      `**Subtotal:** $${proposal.totalCost.toLocaleString()}`,
      proposal.discountPct > 0
        ? `**Volume Discount:** ${proposal.discountPct}%`
        : "",
      `**Estimated Total:** $${proposal.discountedTotal.toLocaleString()}`,
      "",
      `## Deliverables`,
      "",
      ...proposal.deliverables.map((d) => `- ${d}`),
      "",
      `## AlgoVigilance Tools`,
      "",
      ...proposal.nexvigilantTools.map((t) => `- ${t}`),
      "",
      `## Next Steps`,
      "",
      `1. Review this proposal and adjust scope if needed`,
      `2. Book a 30-minute discovery call`,
      `3. Formal SOW within 48 hours`,
      `4. Kickoff within 2 weeks of signing`,
      "",
      `---`,
      `Generated by AlgoVigilance Proposal Engine — ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexvigilant-proposal-${data.company.name?.toLowerCase().replace(/\s+/g, "-") || "draft"}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan">
          <FileText className="h-4 w-4" />
          Proposal Generator
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Consulting Bid Generator
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Fill out your requirements and get an instant AlgoVigilance consulting
          proposal with pricing, deliverables, and tool deployment plan.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="mb-8 flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isComplete = i < step;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-cyan/10 text-cyan"
                    : isComplete
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "text-slate-600"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-slate-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 0 && (
          <CompanyStep
            data={data.company}
            onChange={(company) => setData({ ...data, company })}
          />
        )}
        {step === 1 && (
          <MaturityStep
            data={data.maturity}
            onChange={(maturity) => setData({ ...data, maturity })}
          />
        )}
        {step === 2 && (
          <ScopeStep
            data={data.scope}
            onChange={(scope) => setData({ ...data, scope })}
          />
        )}
        {step === 3 && (
          <TimelineStep
            data={data.timeline}
            onChange={(timeline) => setData({ ...data, timeline })}
          />
        )}
        {step === 4 && proposal && (
          <ProposalView data={data} proposal={proposal} />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
        <button
          type="button"
          onClick={() =>
            step === 0 ? setData(INITIAL_DATA) : setStep(step - 1)
          }
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          {step === 0 ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </>
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </>
          )}
        </button>

        <div className="flex gap-3">
          {step === 4 && proposal && (
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-4 py-2 text-sm text-white hover:border-white/20"
            >
              <Download className="h-3.5 w-3.5" />
              Export Proposal
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance}
              className="flex items-center gap-1.5 rounded-md bg-cyan px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-cyan/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === 3 ? "Generate Proposal" : "Continue"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
