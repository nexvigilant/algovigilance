"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  User,
  AlertTriangle,
  Pill,
  History,
  FileText,
  Download,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { JargonBuster } from "@/components/pv-for-nexvigilants/jargon-buster";
import { AssessorForm } from "@/components/pv-for-nexvigilants/assessor-form";
import { generateAndDownload } from "@/lib/pv-report-generator";
import type { AssessorInfo, ReportConfig } from "@/lib/pv-report-generator";
import {
  generateE2bXml,
  downloadE2bXml,
} from "@/lib/e2b-xml-generator";
import type { E2bCaseData, E2bDrug, E2bReaction } from "@/lib/e2b-xml-generator";

// ─── Types ────────────────────────────────────────────────────────────────────

type SeriousnessCriteria =
  | "death"
  | "lifeThreatening"
  | "hospitalization"
  | "disability"
  | "congenitalAnomaly"
  | "medicallyImportant";

type OutcomeValue = "1" | "2" | "3" | "4" | "5" | "6" | "";
type DechallengeValue = "yes-abated" | "yes-not-abated" | "na" | "unknown" | "";
type RechallengeValue = "yes-recurred" | "yes-not-recurred" | "na" | "unknown" | "";

interface FormState {
  // Section I — Patient
  patientInitials: string;
  country: string;
  dateOfBirth: string;
  age: string;
  ageUnit: "Year" | "Month" | "Day";
  sex: "Male" | "Female" | "";
  weightKg: string;
  heightCm: string;
  // Section II — Adverse Reaction
  reactionDescription: string;
  meddraPreferredTerm: string;
  reactionStartDate: string;
  reactionEndDate: string;
  seriousness: Record<SeriousnessCriteria, boolean>;
  outcome: OutcomeValue;
  // Section III — Suspected Drug
  drugName: string;
  indication: string;
  dailyDose: string;
  route: string;
  therapyStartDate: string;
  therapyEndDate: string;
  dechallenge: DechallengeValue;
  rechallenge: RechallengeValue;
  batchLotNumber: string;
  // Section IV — Concomitant / History
  concomitantDrugs: string;
  medicalHistory: string;
  // Section V — Reporter
  reporterName: string;
  reporterAddress: string;
  reporterQualification: string;
  reportDate: string;
  // Section VI — Administrative
  reportSource: string;
  caseNumber: string;
  reportType: "Initial" | "Follow-up";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYYYYMMDD(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "");
}

function generateCaseNumber(): string {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NV-${yyyymmdd}-${rand}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function outcomeLabel(v: OutcomeValue): string {
  const map: Record<string, string> = {
    "1": "Recovered",
    "2": "Recovering",
    "3": "Not recovered",
    "4": "Recovered with sequelae",
    "5": "Fatal",
    "6": "Unknown",
    "": "—",
  };
  return map[v] ?? "—";
}

function dechallengeLabel(v: DechallengeValue): string {
  const map: Record<string, string> = {
    "yes-abated": "Yes — reaction abated",
    "yes-not-abated": "Yes — reaction did not abate",
    na: "Not applicable",
    unknown: "Unknown",
    "": "—",
  };
  return map[v] ?? "—";
}

function rechallengeLabel(v: RechallengeValue): string {
  const map: Record<string, string> = {
    "yes-recurred": "Yes — reaction recurred",
    "yes-not-recurred": "Yes — reaction did not recur",
    na: "Not applicable",
    unknown: "Unknown",
    "": "—",
  };
  return map[v] ?? "—";
}

function dechallengeToE2b(v: DechallengeValue): "1" | "2" | "3" | undefined {
  if (v === "yes-abated") return "1";
  if (v === "yes-not-abated") return "2";
  if (v === "unknown") return "3";
  return undefined;
}

function rechallengeToE2b(v: RechallengeValue): "1" | "2" | "3" | undefined {
  if (v === "yes-recurred") return "1";
  if (v === "yes-not-recurred") return "2";
  if (v === "unknown") return "3";
  return undefined;
}

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    label: "Patient",
    icon: User,
    description: "Who experienced the adverse event?",
  },
  {
    id: 2,
    label: "Reaction",
    icon: AlertTriangle,
    description: "What happened? How serious was it?",
  },
  {
    id: 3,
    label: "Drug",
    icon: Pill,
    description: "Which drug is suspected?",
  },
  {
    id: 4,
    label: "History",
    icon: History,
    description: "Other drugs and relevant medical history",
  },
  {
    id: 5,
    label: "Reporter",
    icon: FileText,
    description: "Who is submitting this report?",
  },
  {
    id: 6,
    label: "Admin",
    icon: ClipboardList,
    description: "Report classification and case number",
  },
  {
    id: 7,
    label: "Preview",
    icon: Download,
    description: "Review and download your report",
  },
];

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IcsrPage() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState<FormState>({
    patientInitials: "",
    country: "",
    dateOfBirth: "",
    age: "",
    ageUnit: "Year",
    sex: "",
    weightKg: "",
    heightCm: "",
    reactionDescription: "",
    meddraPreferredTerm: "",
    reactionStartDate: "",
    reactionEndDate: "",
    seriousness: {
      death: false,
      lifeThreatening: false,
      hospitalization: false,
      disability: false,
      congenitalAnomaly: false,
      medicallyImportant: false,
    },
    outcome: "",
    drugName: "",
    indication: "",
    dailyDose: "",
    route: "",
    therapyStartDate: "",
    therapyEndDate: "",
    dechallenge: "",
    rechallenge: "",
    batchLotNumber: "",
    concomitantDrugs: "",
    medicalHistory: "",
    reporterName: "",
    reporterAddress: "",
    reporterQualification: "",
    reportDate: todayISO(),
    reportSource: "",
    caseNumber: "",
    reportType: "Initial",
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, caseNumber: generateCaseNumber() }));
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setSeriousness(key: SeriousnessCriteria, value: boolean) {
    setForm((prev) => ({
      ...prev,
      seriousness: { ...prev.seriousness, [key]: value },
    }));
  }

  // ── Validation per step ──
  function validateStep(s: number): string[] {
    const errs: string[] = [];
    if (s === 1 && !form.patientInitials.trim()) {
      errs.push("Patient initials are required.");
    }
    if (s === 2 && !form.reactionDescription.trim()) {
      errs.push("Reaction description is required.");
    }
    if (s === 3 && !form.drugName.trim()) {
      errs.push("Drug name is required.");
    }
    return errs;
  }

  function handleNext() {
    const errs = validateStep(step);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setStep((s) => Math.min(s + 1, 7));
  }

  function handleBack() {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 1));
  }

  // ── PDF generation ──
  function handleDownloadPdf(assessor: AssessorInfo) {
    const seriousnessItems = Object.entries(form.seriousness)
      .filter(([, v]) => v)
      .map(([k]) => {
        const map: Record<string, string> = {
          death: "Death",
          lifeThreatening: "Life-threatening",
          hospitalization: "Hospitalization",
          disability: "Disability",
          congenitalAnomaly: "Congenital anomaly",
          medicallyImportant: "Medically important",
        };
        return map[k] ?? k;
      });

    const config: ReportConfig = {
      title: `ICSR — ${form.patientInitials || "Patient"} / ${form.drugName || "Drug"}`,
      subtitle: `Case Number: ${form.caseNumber}`,
      reportType: "ICSR / CIOMS I Form",
      ichReference: "ICH E2B(R3)",
      drug: form.drugName || "Unknown Drug",
      event: form.reactionDescription.slice(0, 60),
      generatedAt: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      assessor,
      sections: [
        {
          type: "key-value",
          title: "Section I — Patient Information",
          entries: [
            { key: "Patient Initials", value: form.patientInitials || "—" },
            { key: "Country", value: form.country || "—" },
            {
              key: "Date of Birth",
              value: form.dateOfBirth || (form.age ? `${form.age} ${form.ageUnit}(s)` : "—"),
            },
            { key: "Sex", value: form.sex || "—" },
            { key: "Weight (kg)", value: form.weightKg || "—" },
            { key: "Height (cm)", value: form.heightCm || "—" },
          ],
        },
        {
          type: "text",
          title: "Section II — Adverse Reaction Description",
          body: form.reactionDescription || "—",
        },
        {
          type: "key-value",
          title: "Section II — Reaction Details",
          entries: [
            { key: "MedDRA Preferred Term", value: form.meddraPreferredTerm || "—" },
            { key: "Reaction Start", value: form.reactionStartDate || "—" },
            { key: "Reaction End", value: form.reactionEndDate || "—" },
            {
              key: "Seriousness Criteria",
              value: seriousnessItems.length > 0 ? seriousnessItems.join(", ") : "None selected",
            },
            { key: "Outcome", value: outcomeLabel(form.outcome) },
          ],
        },
        {
          type: "table",
          title: "Section III — Suspected Drug",
          headers: ["Field", "Value"],
          rows: [
            ["Drug Name", form.drugName || "—"],
            ["Indication", form.indication || "—"],
            ["Daily Dose", form.dailyDose || "—"],
            ["Route", form.route || "—"],
            ["Therapy Start", form.therapyStartDate || "—"],
            ["Therapy End", form.therapyEndDate || "—"],
            ["Dechallenge", dechallengeLabel(form.dechallenge)],
            ["Rechallenge", rechallengeLabel(form.rechallenge)],
            ["Batch/Lot Number", form.batchLotNumber || "—"],
          ],
        },
        {
          type: "text",
          title: "Section IV — Concomitant Drugs",
          body: form.concomitantDrugs || "None reported",
        },
        {
          type: "text",
          title: "Section IV — Relevant Medical History",
          body: form.medicalHistory || "None reported",
        },
        {
          type: "key-value",
          title: "Section V — Reporter Information",
          entries: [
            { key: "Reporter Name", value: form.reporterName || "—" },
            { key: "Address", value: form.reporterAddress || "—" },
            { key: "Qualification", value: form.reporterQualification || "—" },
            { key: "Report Date", value: form.reportDate },
          ],
        },
        {
          type: "key-value",
          title: "Section VI — Administrative",
          entries: [
            { key: "Case Number", value: form.caseNumber },
            { key: "Report Type", value: form.reportType },
            { key: "Report Source", value: form.reportSource || "—" },
          ],
        },
      ],
    };

    generateAndDownload(config, `CIOMS-I-${form.caseNumber}.pdf`);
  }

  // ── E2B XML generation ──
  function handleDownloadXml() {
    const ageUnitCode =
      form.ageUnit === "Year" ? "801" : form.ageUnit === "Month" ? "802" : "803";

    const outcomeE2b = form.outcome as E2bReaction["outcome"];

    const reactions: E2bReaction[] = [
      {
        description: form.reactionDescription,
        meddraCode: form.meddraPreferredTerm || undefined,
        startDate: toYYYYMMDD(form.reactionStartDate) || undefined,
        endDate: toYYYYMMDD(form.reactionEndDate) || undefined,
        outcome: outcomeE2b || undefined,
        seriousness: {
          death: form.seriousness.death,
          lifeThreatening: form.seriousness.lifeThreatening,
          hospitalization: form.seriousness.hospitalization,
          disability: form.seriousness.disability,
          congenitalAnomaly: form.seriousness.congenitalAnomaly,
          medicallyImportant: form.seriousness.medicallyImportant,
        },
      },
    ];

    const suspectDrug: E2bDrug = {
      name: form.drugName,
      characterization: "1",
      indication: form.indication || undefined,
      dose: form.dailyDose || undefined,
      route: form.route || undefined,
      startDate: toYYYYMMDD(form.therapyStartDate) || undefined,
      endDate: toYYYYMMDD(form.therapyEndDate) || undefined,
      dechallenge: dechallengeToE2b(form.dechallenge),
      rechallenge: rechallengeToE2b(form.rechallenge),
      batchNumber: form.batchLotNumber || undefined,
    };

    const concomitantDrugs: E2bDrug[] = form.concomitantDrugs
      ? form.concomitantDrugs
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
          .map((name) => ({ name, characterization: "2" as const }))
      : [];

    const caseData: E2bCaseData = {
      safetyReportId: form.caseNumber,
      reportType: form.reportType === "Initial" ? "1" : "2",
      reportDate: toYYYYMMDD(form.reportDate) || toYYYYMMDD(todayISO()),
      senderOrganization: form.reporterName || "AlgoVigilance",
      receiverOrganization: "Regulatory Authority",
      patientInitials: form.patientInitials,
      patientAge: form.age ? parseInt(form.age, 10) : undefined,
      patientAgeUnit: form.age ? ageUnitCode : undefined,
      patientSex: form.sex === "Male" ? "1" : form.sex === "Female" ? "2" : undefined,
      patientWeight: form.weightKg ? parseFloat(form.weightKg) : undefined,
      patientHeight: form.heightCm ? parseFloat(form.heightCm) : undefined,
      medicalHistory: form.medicalHistory || undefined,
      drugs: [suspectDrug, ...concomitantDrugs],
      reactions,
      narrative: `Case ${form.caseNumber}: ${form.patientInitials} experienced ${form.reactionDescription} while taking ${form.drugName}.`,
    };

    const xml = generateE2bXml(caseData);
    downloadE2bXml(xml, `E2B-${form.caseNumber}.xml`);
  }

  // ─── Step indicator ──────────────────────────────────────────────────────────

  function StepIndicator() {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;

          return (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (isDone) {
                    setErrors([]);
                    setStep(s.id);
                  }
                }}
                className={[
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : isDone
                      ? "bg-green-900/40 text-green-400 hover:bg-green-900/60 cursor-pointer"
                      : "bg-zinc-800 text-zinc-500 cursor-default",
                ].join(" ")}
                disabled={!isDone}
              >
                {isDone ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-zinc-600 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Step panels ─────────────────────────────────────────────────────────────

  const inputCls = "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500 h-9 text-sm";
  const textareaCls = "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500 text-sm resize-none";

  function StepSection({
    title,
    description,
    icon: Icon,
    children,
  }: {
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    children: React.ReactNode;
  }) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-5">{description}</p>
        {children}
      </div>
    );
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <StepSection
            title="Patient Information"
            description="Basic demographics — used for the CIOMS I form header. Patient privacy is protected: use initials only."
            icon={User}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Patient Initials" required>
                <Input
                  className={inputCls}
                  placeholder="e.g. J.D."
                  value={form.patientInitials}
                  onChange={(e) => set("patientInitials", e.target.value)}
                />
              </Field>
              <Field label="Country">
                <Input
                  className={inputCls}
                  placeholder="e.g. United States"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                />
              </Field>
              <Field label="Date of Birth" hint="Leave blank if using age below">
                <Input
                  type="date"
                  className={inputCls}
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </Field>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-300">
                  Age (if no DOB)
                </Label>
                <div className="flex gap-2">
                  <Input
                    className={`${inputCls} flex-1`}
                    placeholder="e.g. 52"
                    value={form.age}
                    onChange={(e) => set("age", e.target.value)}
                  />
                  <Select
                    value={form.ageUnit}
                    onValueChange={(v) =>
                      set("ageUnit", v as FormState["ageUnit"])
                    }
                  >
                    <SelectTrigger className="w-28 bg-zinc-900 border-zinc-700 text-white h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="Year">Year</SelectItem>
                      <SelectItem value="Month">Month</SelectItem>
                      <SelectItem value="Day">Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Field label="Sex">
                <Select
                  value={form.sex}
                  onValueChange={(v) => set("sex", v as FormState["sex"])}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Weight (kg)">
                  <Input
                    className={inputCls}
                    placeholder="e.g. 70"
                    value={form.weightKg}
                    onChange={(e) => set("weightKg", e.target.value)}
                  />
                </Field>
                <Field label="Height (cm)">
                  <Input
                    className={inputCls}
                    placeholder="e.g. 175"
                    value={form.heightCm}
                    onChange={(e) => set("heightCm", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </StepSection>
        );

      case 2:
        return (
          <StepSection
            title="Suspected Adverse Reaction(s)"
            description="Describe what happened to the patient. Be as specific as possible — this is the core of the ICSR."
            icon={AlertTriangle}
          >
            <div className="space-y-4">
              <Field label="Reaction Description" required>
                <Textarea
                  className={`${textareaCls} min-h-[80px]`}
                  placeholder="Describe the adverse reaction in detail..."
                  value={form.reactionDescription}
                  onChange={(e) => set("reactionDescription", e.target.value)}
                />
              </Field>
              <Field
                label={
                  <span>
                    <JargonBuster
                      term="MedDRA"
                      definition="Medical Dictionary for Regulatory Activities — the international medical terminology used to classify adverse events in regulatory submissions."
                    >
                      MedDRA
                    </JargonBuster>
                    {" Preferred Term"}
                  </span>
                }
                hint="Optional — type the standardized term if known (e.g. Hepatotoxicity)"
              >
                <Input
                  className={inputCls}
                  placeholder="e.g. Acute liver failure"
                  value={form.meddraPreferredTerm}
                  onChange={(e) => set("meddraPreferredTerm", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Reaction Start Date">
                  <Input
                    type="date"
                    className={inputCls}
                    value={form.reactionStartDate}
                    onChange={(e) => set("reactionStartDate", e.target.value)}
                  />
                </Field>
                <Field label="Reaction End Date">
                  <Input
                    type="date"
                    className={inputCls}
                    value={form.reactionEndDate}
                    onChange={(e) => set("reactionEndDate", e.target.value)}
                  />
                </Field>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-300">
                  Seriousness Criteria{" "}
                  <span className="text-zinc-500 font-normal">
                    (check all that apply)
                  </span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      { key: "death", label: "Death" },
                      { key: "lifeThreatening", label: "Life-threatening" },
                      { key: "hospitalization", label: "Hospitalization" },
                      { key: "disability", label: "Disability" },
                      { key: "congenitalAnomaly", label: "Congenital anomaly" },
                      { key: "medicallyImportant", label: "Medically important" },
                    ] as { key: SeriousnessCriteria; label: string }[]
                  ).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`serious-${key}`}
                        checked={form.seriousness[key]}
                        onCheckedChange={(v) =>
                          setSeriousness(key, v === true)
                        }
                        className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label
                        htmlFor={`serious-${key}`}
                        className="text-sm text-zinc-300 cursor-pointer"
                      >
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Field label="Outcome">
                <Select
                  value={form.outcome}
                  onValueChange={(v) => set("outcome", v as OutcomeValue)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm w-full">
                    <SelectValue placeholder="Select outcome..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="1">Recovered</SelectItem>
                    <SelectItem value="2">Recovering</SelectItem>
                    <SelectItem value="3">Not recovered</SelectItem>
                    <SelectItem value="4">Recovered with sequelae</SelectItem>
                    <SelectItem value="5">Fatal</SelectItem>
                    <SelectItem value="6">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </StepSection>
        );

      case 3:
        return (
          <StepSection
            title="Suspected Drug(s)"
            description="The drug you believe caused or contributed to the adverse reaction."
            icon={Pill}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Drug Name" required>
                <Input
                  className={inputCls}
                  placeholder="e.g. Metformin"
                  value={form.drugName}
                  onChange={(e) => set("drugName", e.target.value)}
                />
              </Field>
              <Field label="Indication" hint="What was the drug prescribed for?">
                <Input
                  className={inputCls}
                  placeholder="e.g. Type 2 Diabetes"
                  value={form.indication}
                  onChange={(e) => set("indication", e.target.value)}
                />
              </Field>
              <Field label="Daily Dose">
                <Input
                  className={inputCls}
                  placeholder="e.g. 500 mg twice daily"
                  value={form.dailyDose}
                  onChange={(e) => set("dailyDose", e.target.value)}
                />
              </Field>
              <Field label="Route of Administration">
                <Select
                  value={form.route}
                  onValueChange={(v) => set("route", v)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm w-full">
                    <SelectValue placeholder="Select route..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="Oral">Oral</SelectItem>
                    <SelectItem value="Subcutaneous">Subcutaneous</SelectItem>
                    <SelectItem value="Intravenous">Intravenous</SelectItem>
                    <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                    <SelectItem value="Topical">Topical</SelectItem>
                    <SelectItem value="Inhalation">Inhalation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Therapy Start Date">
                <Input
                  type="date"
                  className={inputCls}
                  value={form.therapyStartDate}
                  onChange={(e) => set("therapyStartDate", e.target.value)}
                />
              </Field>
              <Field label="Therapy End Date">
                <Input
                  type="date"
                  className={inputCls}
                  value={form.therapyEndDate}
                  onChange={(e) => set("therapyEndDate", e.target.value)}
                />
              </Field>
              <Field
                label={
                  <span>
                    <JargonBuster
                      term="Dechallenge"
                      definition="What happened to the adverse reaction when the suspected drug was stopped or reduced. A positive dechallenge (reaction improved) strengthens the causal link."
                    >
                      Dechallenge
                    </JargonBuster>
                  </span>
                }
              >
                <Select
                  value={form.dechallenge}
                  onValueChange={(v) =>
                    set("dechallenge", v as DechallengeValue)
                  }
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="yes-abated">
                      Yes — reaction abated
                    </SelectItem>
                    <SelectItem value="yes-not-abated">
                      Yes — reaction did not abate
                    </SelectItem>
                    <SelectItem value="na">Not applicable</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label={
                  <span>
                    <JargonBuster
                      term="Rechallenge"
                      definition="What happened when the same drug was given again after the adverse reaction. A positive rechallenge (reaction recurred) is one of the strongest indicators of causality."
                    >
                      Rechallenge
                    </JargonBuster>
                  </span>
                }
              >
                <Select
                  value={form.rechallenge}
                  onValueChange={(v) =>
                    set("rechallenge", v as RechallengeValue)
                  }
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="yes-recurred">
                      Yes — reaction recurred
                    </SelectItem>
                    <SelectItem value="yes-not-recurred">
                      Yes — reaction did not recur
                    </SelectItem>
                    <SelectItem value="na">Not applicable</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Batch / Lot Number">
                <Input
                  className={inputCls}
                  placeholder="e.g. LOT-2024-A"
                  value={form.batchLotNumber}
                  onChange={(e) => set("batchLotNumber", e.target.value)}
                />
              </Field>
            </div>
          </StepSection>
        );

      case 4:
        return (
          <StepSection
            title="Concomitant Drugs and Medical History"
            description="Other drugs the patient was taking, and any relevant past medical conditions. This helps rule out confounders."
            icon={History}
          >
            <div className="space-y-4">
              <Field
                label="Concomitant Drugs"
                hint="Separate multiple drugs with commas"
              >
                <Textarea
                  className={`${textareaCls} min-h-[70px]`}
                  placeholder="e.g. Lisinopril 10 mg, Atorvastatin 20 mg"
                  value={form.concomitantDrugs}
                  onChange={(e) => set("concomitantDrugs", e.target.value)}
                />
              </Field>
              <Field label="Relevant Medical History">
                <Textarea
                  className={`${textareaCls} min-h-[100px]`}
                  placeholder="e.g. Hypertension, Type 2 Diabetes diagnosed 2018, no known drug allergies..."
                  value={form.medicalHistory}
                  onChange={(e) => set("medicalHistory", e.target.value)}
                />
              </Field>
            </div>
          </StepSection>
        );

      case 5:
        return (
          <StepSection
            title="Reporter Information"
            description="Who is submitting this Individual Case Safety Report?"
            icon={FileText}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Reporter Name">
                <Input
                  className={inputCls}
                  placeholder="e.g. Dr. Jane Smith"
                  value={form.reporterName}
                  onChange={(e) => set("reporterName", e.target.value)}
                />
              </Field>
              <Field label="Reporter Qualification">
                <Select
                  value={form.reporterQualification}
                  onValueChange={(v) => set("reporterQualification", v)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="Physician">Physician</SelectItem>
                    <SelectItem value="Pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="Other health professional">
                      Other health professional
                    </SelectItem>
                    <SelectItem value="Lawyer">Lawyer</SelectItem>
                    <SelectItem value="Consumer">Consumer</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Reporter Address">
                  <Input
                    className={inputCls}
                    placeholder="e.g. 123 Medical Center Drive, Boston, MA 02115"
                    value={form.reporterAddress}
                    onChange={(e) => set("reporterAddress", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Report Date">
                <Input
                  type="date"
                  className={inputCls}
                  value={form.reportDate}
                  onChange={(e) => set("reportDate", e.target.value)}
                />
              </Field>
            </div>
          </StepSection>
        );

      case 6:
        return (
          <StepSection
            title="Administrative Information"
            description="Report classification and tracking number."
            icon={ClipboardList}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Case Number" hint="Auto-generated — you can edit if needed">
                <Input
                  className={inputCls}
                  value={form.caseNumber}
                  onChange={(e) => set("caseNumber", e.target.value)}
                />
              </Field>
              <Field label="Report Type">
                <Select
                  value={form.reportType}
                  onValueChange={(v) =>
                    set("reportType", v as FormState["reportType"])
                  }
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="Initial">Initial</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Report Source">
                  <Select
                    value={form.reportSource}
                    onValueChange={(v) => set("reportSource", v)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white h-9 text-sm w-full">
                      <SelectValue placeholder="Select source..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                      <SelectItem value="Clinical trial">
                        Clinical trial
                      </SelectItem>
                      <SelectItem value="Literature">Literature</SelectItem>
                      <SelectItem value="Healthcare professional">
                        Healthcare professional
                      </SelectItem>
                      <SelectItem value="Regulatory authority">
                        Regulatory authority
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </StepSection>
        );

      case 7:
        return (
          <StepSection
            title="Preview and Download"
            description="Review the case summary below, then download your report."
            icon={Download}
          >
            <div className="space-y-6">
              {/* Case summary preview */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 divide-y divide-zinc-800 text-sm">
                <PreviewRow label="Case Number" value={form.caseNumber} />
                <PreviewRow
                  label="Patient"
                  value={`${form.patientInitials || "—"}, ${form.sex || "—"}, ${form.age ? `${form.age} ${form.ageUnit}` : form.dateOfBirth || "—"}`}
                />
                <PreviewRow label="Country" value={form.country || "—"} />
                <PreviewRow
                  label="Reaction"
                  value={form.reactionDescription || "—"}
                  multiline
                />
                <PreviewRow
                  label="Seriousness"
                  value={
                    Object.entries(form.seriousness)
                      .filter(([, v]) => v)
                      .map(([k]) => {
                        const m: Record<string, string> = {
                          death: "Death",
                          lifeThreatening: "Life-threatening",
                          hospitalization: "Hospitalization",
                          disability: "Disability",
                          congenitalAnomaly: "Congenital anomaly",
                          medicallyImportant: "Medically important",
                        };
                        return m[k] ?? k;
                      })
                      .join(", ") || "None"
                  }
                />
                <PreviewRow
                  label="Outcome"
                  value={outcomeLabel(form.outcome)}
                />
                <PreviewRow label="Suspected Drug" value={form.drugName || "—"} />
                <PreviewRow
                  label="Dose / Route"
                  value={
                    [form.dailyDose, form.route].filter(Boolean).join(" — ") ||
                    "—"
                  }
                />
                <PreviewRow
                  label="Dechallenge"
                  value={dechallengeLabel(form.dechallenge)}
                />
                <PreviewRow
                  label="Rechallenge"
                  value={rechallengeLabel(form.rechallenge)}
                />
                <PreviewRow
                  label="Reporter"
                  value={
                    [form.reporterName, form.reporterQualification]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <PreviewRow label="Report Date" value={form.reportDate} />
                <PreviewRow label="Report Type" value={form.reportType} />
                <PreviewRow
                  label="Source"
                  value={form.reportSource || "—"}
                />
              </div>

              {/* PDF download via AssessorForm */}
              <div>
                <p className="text-xs text-zinc-400 mb-3">
                  Personalize and download as a{" "}
                  <strong className="text-white">PDF (CIOMS I format)</strong>:
                </p>
                <AssessorForm onDownload={handleDownloadPdf} />
              </div>

              {/* E2B XML download */}
              <div>
                <p className="text-xs text-zinc-400 mb-3">
                  Download as{" "}
                  <JargonBuster
                    term="E2B(R3)"
                    definition="The ICH E2B(R3) standard defines the electronic format for transmitting Individual Case Safety Reports to regulatory authorities worldwide (FDA, EMA, etc.)."
                  >
                    E2B(R3) XML
                  </JargonBuster>{" "}
                  for regulatory submission:
                </p>
                <Button
                  type="button"
                  onClick={handleDownloadXml}
                  variant="outline"
                  className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  size="lg"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download E2B(R3) XML
                </Button>
              </div>
            </div>
          </StepSection>
        );

      default:
        return null;
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="h-5 w-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">
              <JargonBuster
                term="ICSR"
                definition="Individual Case Safety Report — a structured report documenting a single adverse event experienced by a patient taking a drug. Required by regulatory agencies worldwide."
              >
                ICSR
              </JargonBuster>{" "}
              /{" "}
              <JargonBuster
                term="CIOMS"
                definition="Council for International Organizations of Medical Sciences. The CIOMS I form is the standard paper format for reporting adverse drug reactions internationally."
              >
                CIOMS I Form
              </JargonBuster>
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            Generate an Individual Case Safety Report
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6">
          <StepIndicator />
        </div>

        {/* Step description */}
        <p className="text-[11px] text-zinc-500 mb-4">
          Step {step} of 7 — {STEPS[step - 1].description}
        </p>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3">
            {errors.map((e) => (
              <p key={e} className="text-sm text-red-400">
                {e}
              </p>
            ))}
          </div>
        )}

        {/* Step content */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 mb-6">
          {renderStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < 7 && (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Preview row ──────────────────────────────────────────────────────────────

function PreviewRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-3 px-4 py-2.5">
      <span className="w-36 flex-shrink-0 text-xs font-medium text-zinc-500">
        {label}
      </span>
      <span
        className={[
          "text-sm text-zinc-200",
          multiline ? "whitespace-pre-wrap" : "truncate",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
