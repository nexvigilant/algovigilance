"use client";

import { useState, useCallback } from "react";
import {
  Workflow,
  Search,
  ClipboardList,
  ClipboardCheck,
  FileText,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Copy,
  Save,
  Loader2,
} from "lucide-react";
import {
  TipBox,
  RememberBox,
  TechnicalStuffBox,
  JargonBuster,
  StepWizard,
} from "@/components/pv-for-nexvigilants";
import { cn } from "@/lib/utils";
import {
  defineWorkflow,
  type WorkflowDefinition as PvosWorkflowDefinition,
} from "@/lib/pvos-client";
import { routeWorkflow, type WorkflowRoute } from "@/lib/pv-compute";

// ---------------------------------------------------------------------------
// PVOS SyscallKind-aligned step types
// ---------------------------------------------------------------------------

type SyscallKind = "Detect" | "Triage" | "Assess" | "Report" | "Review";

interface WorkflowStep {
  id: string;
  kind: SyscallKind;
  label: string;
  description: string;
}

interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

// ---------------------------------------------------------------------------
// SyscallKind metadata
// ---------------------------------------------------------------------------

const SYSCALL_KINDS: {
  kind: SyscallKind;
  label: string;
  description: string;
  icon: typeof Search;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    kind: "Detect",
    label: "Detect",
    description:
      "Signal detection — identify potential safety signals from data sources",
    icon: Search,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  {
    kind: "Triage",
    label: "Triage",
    description:
      "Case triage — classify seriousness and route to the right team",
    icon: ClipboardList,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    kind: "Assess",
    label: "Assess",
    description:
      "Causality assessment — evaluate whether the drug caused the event",
    icon: ClipboardCheck,
    color: "text-cyan",
    bgColor: "bg-cyan/10",
    borderColor: "border-cyan/30",
  },
  {
    kind: "Report",
    label: "Report",
    description:
      "Regulatory reporting — generate and submit required safety reports",
    icon: FileText,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  {
    kind: "Review",
    label: "Review",
    description:
      "Periodic review — evaluate cumulative data for benefit-risk updates",
    icon: Eye,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
];

function getSyscallMeta(kind: SyscallKind) {
  return SYSCALL_KINDS.find((s) => s.kind === kind) ?? SYSCALL_KINDS[0];
}

// ---------------------------------------------------------------------------
// Workflow templates
// ---------------------------------------------------------------------------

interface WorkflowTemplate {
  name: string;
  description: string;
  steps: Omit<WorkflowStep, "id">[];
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    name: "Standard Signal-to-Report",
    description:
      "The classic PV workflow: detect a signal, triage the case, assess causality, and file the report.",
    steps: [
      {
        kind: "Detect",
        label: "Run signal detection",
        description: "PRR/ROR/EBGM scan across FAERS data",
      },
      {
        kind: "Triage",
        label: "Classify seriousness",
        description: "ICH E2A seriousness criteria check",
      },
      {
        kind: "Assess",
        label: "Naranjo causality",
        description: "10-question causality algorithm",
      },
      {
        kind: "Report",
        label: "File expedited report",
        description: "Generate E2B(R3) ICSR for submission",
      },
    ],
  },
  {
    name: "Periodic Safety Review",
    description:
      "For scheduled benefit-risk evaluations — PBRER and aggregate signal review.",
    steps: [
      {
        kind: "Detect",
        label: "Aggregate signal scan",
        description: "Cumulative disproportionality across portfolio",
      },
      {
        kind: "Review",
        label: "Benefit-risk evaluation",
        description: "QBRI assessment with current data",
      },
      {
        kind: "Report",
        label: "Generate PBRER",
        description: "ICH E2C(R2) periodic report",
      },
    ],
  },
  {
    name: "Rapid Triage Pipeline",
    description:
      "Fast-track intake for high-volume periods — triage first, investigate later.",
    steps: [
      {
        kind: "Triage",
        label: "Initial seriousness screen",
        description: "Quick classify: serious vs non-serious",
      },
      {
        kind: "Triage",
        label: "Route by seriousness",
        description: "Fatal/LT to expedited, others to standard queue",
      },
      {
        kind: "Assess",
        label: "WHO-UMC assessment",
        description: "Rapid causality categorization",
      },
      {
        kind: "Report",
        label: "Deadline assignment",
        description: "Calculate reporting deadlines by seriousness",
      },
      {
        kind: "Review",
        label: "Supervisor sign-off",
        description: "QA review before submission",
      },
    ],
  },
  {
    name: "Blank Pipeline",
    description: "Start from scratch — add your own steps.",
    steps: [],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `step-${Date.now()}-${idCounter}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowBuilder() {
  const [wizardStep, setWizardStep] = useState(0);
  const [workflow, setWorkflow] = useState<WorkflowDefinition>({
    name: "",
    description: "",
    steps: [],
  });
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    workflow_id: string;
  } | null>(null);

  // --- Step 1: Name & template ---
  const applyTemplate = useCallback((index: number) => {
    const template = TEMPLATES[index];
    setSelectedTemplate(index);
    setWorkflow({
      name: template.name === "Blank Pipeline" ? "" : template.name,
      description:
        template.name === "Blank Pipeline" ? "" : template.description,
      steps: template.steps.map((s) => ({ ...s, id: nextId() })),
    });
  }, []);

  // --- Step 2: Add/remove/reorder steps ---
  const addStep = useCallback((kind: SyscallKind) => {
    const meta = getSyscallMeta(kind);
    setWorkflow((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: nextId(),
          kind,
          label: meta.label,
          description: meta.description,
        },
      ],
    }));
  }, []);

  const removeStep = useCallback((id: string) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== id),
    }));
  }, []);

  const moveStep = useCallback((index: number, direction: -1 | 1) => {
    setWorkflow((prev) => {
      const newSteps = [...prev.steps];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
      const temp = newSteps[index];
      newSteps[index] = newSteps[targetIndex];
      newSteps[targetIndex] = temp;
      return { ...prev, steps: newSteps };
    });
  }, []);

  const updateStepLabel = useCallback((id: string, label: string) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, label } : s)),
    }));
  }, []);

  const updateStepDescription = useCallback(
    (id: string, description: string) => {
      setWorkflow((prev) => ({
        ...prev,
        steps: prev.steps.map((s) => (s.id === id ? { ...s, description } : s)),
      }));
    },
    [],
  );

  // --- Copy to clipboard ---
  const copyWorkflow = useCallback(() => {
    const yaml = [
      `name: "${workflow.name}"`,
      `description: "${workflow.description}"`,
      `steps:`,
      ...workflow.steps.map(
        (s, i) =>
          `  - step: ${i + 1}\n    kind: ${s.kind}\n    label: "${s.label}"\n    description: "${s.description}"`,
      ),
    ].join("\n");
    navigator.clipboard.writeText(yaml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [workflow]);

  // --- Save workflow to PVOS server ---
  const saveWorkflow = useCallback(async () => {
    setSaving(true);
    setSaveResult(null);
    // Map local WorkflowStep (with SyscallKind casing) to pvos-client WorkflowDefinition
    const pvosPayload: PvosWorkflowDefinition = {
      name: workflow.name,
      description: workflow.description,
      steps: workflow.steps.map((s) => ({
        name: s.label,
        kind: s.kind.toLowerCase() as PvosWorkflowDefinition["steps"][number]["kind"],
        description: s.description,
      })),
    };
    const result = await defineWorkflow(pvosPayload);
    setSaveResult(result);
    setSaving(false);
  }, [workflow]);

  // --- Wizard step content ---
  const canProceedStep0 = workflow.name.trim().length > 0;
  const canProceedStep1 = workflow.steps.length > 0;

  const wizardSteps = [
    {
      title: "Name Your Workflow",
      description:
        "Pick a template to start from, or name your own custom pipeline.",
      content: (
        <div className="space-y-6">
          {/* Template picker */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Start from a template
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TEMPLATES.map((template, i) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => applyTemplate(i)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all duration-200",
                    selectedTemplate === i
                      ? "border-cyan/40 bg-cyan/5 ring-1 ring-cyan/20"
                      : "border-white/[0.08] bg-white/[0.04] hover:border-white/[0.16] hover:bg-white/[0.06]",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={cn(
                        "h-4 w-4",
                        selectedTemplate === i
                          ? "text-cyan"
                          : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-white">
                      {template.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                  {template.steps.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {template.steps.map((s, si) => {
                        const meta = getSyscallMeta(s.kind);
                        return (
                          <span
                            key={si}
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                              meta.color,
                              meta.bgColor,
                              meta.borderColor,
                            )}
                          >
                            {s.kind}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name & description inputs */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="workflow-name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Workflow Name
              </label>
              <input
                id="workflow-name"
                type="text"
                placeholder="e.g., Our Signal-to-Report Pipeline"
                value={workflow.name}
                onChange={(e) =>
                  setWorkflow((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-cyan/40 focus:outline-none focus:ring-1 focus:ring-cyan/20"
              />
            </div>
            <div>
              <label
                htmlFor="workflow-desc"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Description (optional)
              </label>
              <textarea
                id="workflow-desc"
                placeholder="What does this workflow do? When should someone use it?"
                value={workflow.description}
                onChange={(e) =>
                  setWorkflow((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={2}
                className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:border-cyan/40 focus:outline-none focus:ring-1 focus:ring-cyan/20 resize-none"
              />
            </div>
          </div>

          <TipBox>
            Templates give you a head start, but you can customize every step in
            the next stage. Pick the one closest to what you need.
          </TipBox>
        </div>
      ),
    },
    {
      title: "Build Your Pipeline",
      description:
        "Add steps from the five PVOS operations. Drag to reorder, click to edit.",
      content: (
        <div className="space-y-6">
          {/* Add step buttons */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add a step
            </label>
            <div className="flex flex-wrap gap-2">
              {SYSCALL_KINDS.map((sk) => {
                const Icon = sk.icon;
                return (
                  <button
                    key={sk.kind}
                    type="button"
                    onClick={() => addStep(sk.kind)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:scale-[1.02]",
                      sk.color,
                      sk.bgColor,
                      sk.borderColor,
                      "hover:brightness-125",
                    )}
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {sk.label}
                  </button>
                );
              })}
            </div>
          </div>

          <RememberBox>
            Each step maps to a{" "}
            <JargonBuster
              term="PVOS SyscallKind"
              definition="The five fundamental operations in the PV Operating System: Detect (find signals), Triage (classify severity), Assess (evaluate causality), Report (file with regulators), and Review (periodic evaluation)."
            >
              PVOS operation
            </JargonBuster>
            . You can have multiple steps of the same type — for example, two
            Detect steps that check different data sources.
          </RememberBox>

          {/* Current steps */}
          {workflow.steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] py-12 text-center">
              <Workflow
                className="mb-3 h-8 w-8 text-muted-foreground/40"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground/60">
                No steps yet. Click a button above to add one.
              </p>
            </div>
          ) : (
            <div className="space-y-2" role="list" aria-label="Pipeline steps">
              {workflow.steps.map((step, index) => {
                const meta = getSyscallMeta(step.kind);
                const Icon = meta.icon;
                return (
                  <div
                    key={step.id}
                    role="listitem"
                    className="group flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 transition-all hover:border-white/[0.16]"
                  >
                    {/* Grip + index */}
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <GripVertical
                        className="h-4 w-4 text-muted-foreground/40"
                        aria-hidden="true"
                      />
                      <span className="text-[10px] font-mono text-muted-foreground/40">
                        {index + 1}
                      </span>
                    </div>

                    {/* Kind badge */}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                        meta.bgColor,
                        meta.borderColor,
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4", meta.color)}
                        aria-hidden="true"
                      />
                    </div>

                    {/* Editable fields */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            meta.color,
                          )}
                        >
                          {step.kind}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={step.label}
                        onChange={(e) =>
                          updateStepLabel(step.id, e.target.value)
                        }
                        className="w-full bg-transparent text-sm font-medium text-white placeholder:text-muted-foreground/50 focus:outline-none"
                        placeholder="Step name..."
                        aria-label={`Step ${index + 1} name`}
                      />
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) =>
                          updateStepDescription(step.id, e.target.value)
                        }
                        className="w-full bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                        placeholder="What happens in this step?"
                        aria-label={`Step ${index + 1} description`}
                      />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        className="rounded p-1 text-muted-foreground hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Move step ${index + 1} up`}
                      >
                        <ChevronLeft
                          className="h-3.5 w-3.5 rotate-90"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, 1)}
                        disabled={index === workflow.steps.length - 1}
                        className="rounded p-1 text-muted-foreground hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label={`Move step ${index + 1} down`}
                      >
                        <ChevronRight
                          className="h-3.5 w-3.5 rotate-90"
                          aria-hidden="true"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Review Your Pipeline",
      description:
        "Here's your complete workflow. Copy it or go back to make changes.",
      content: (
        <div className="space-y-6">
          {/* Summary header */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-white">
                  {workflow.name || "Untitled Workflow"}
                </h4>
                {workflow.description && (
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {workflow.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {workflow.steps.length} step
                  {workflow.steps.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Kind distribution */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                ["Detect", "Triage", "Assess", "Report", "Review"] as const
              ).map((kind) => {
                const count = workflow.steps.filter(
                  (s) => s.kind === kind,
                ).length;
                if (count === 0) return null;
                const meta = getSyscallMeta(kind);
                return (
                  <span
                    key={kind}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                      meta.color,
                      meta.bgColor,
                      meta.borderColor,
                    )}
                  >
                    {kind} x{count}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Visual pipeline */}
          <div className="space-y-0">
            {workflow.steps.map((step, index) => {
              const meta = getSyscallMeta(step.kind);
              const Icon = meta.icon;
              const isLast = index === workflow.steps.length - 1;
              return (
                <div key={step.id} className="flex items-stretch gap-4">
                  {/* Vertical connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                        meta.bgColor,
                        meta.borderColor,
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4", meta.color)}
                        aria-hidden="true"
                      />
                    </div>
                    {!isLast && (
                      <div
                        className="w-0.5 flex-1 bg-white/10"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className={cn("pb-6", isLast && "pb-0")}>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          meta.color,
                        )}
                      >
                        {step.kind}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/40">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Copy + Save buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyWorkflow}
              className="flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/5 px-4 py-2.5 text-sm font-medium text-cyan hover:bg-cyan/10 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy as YAML
                </>
              )}
            </button>

            <button
              type="button"
              onClick={saveWorkflow}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save Workflow
                </>
              )}
            </button>

            <span className="text-xs text-muted-foreground">
              Export or save this workflow definition
            </span>
          </div>

          {/* Save result feedback */}
          {saveResult && (
            <div
              className={cn(
                "rounded-lg border px-4 py-3 text-sm",
                saveResult.success
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300",
              )}
            >
              {saveResult.success ? (
                <>
                  <Check className="inline h-4 w-4 mr-1.5" aria-hidden="true" />
                  Workflow saved{" "}
                  {saveResult.workflow_id
                    ? `(ID: ${saveResult.workflow_id})`
                    : ""}
                </>
              ) : (
                <>
                  Saved locally — PVOS server unreachable. Copy the YAML to keep
                  a record.
                </>
              )}
            </div>
          )}

          <TechnicalStuffBox>
            Each step maps to a PVOS{" "}
            <JargonBuster
              term="SyscallKind"
              definition="The fundamental operation types in the PV Operating System kernel. Like system calls in an OS, these are the building blocks that all PV workflows are composed from."
            >
              SyscallKind
            </JargonBuster>
            . When connected to the PVOS kernel, each step becomes an executable
            system call that processes real case data through the pipeline.
            Detect calls the signal detection engine, Triage invokes the
            seriousness classifier, and so on.
          </TechnicalStuffBox>

          <TipBox>
            Use &quot;Save Workflow&quot; to send your pipeline to the PVOS
            server, or &quot;Copy as YAML&quot; to export the definition
            locally. If the server is unreachable, the copy is your backup.
          </TipBox>
        </div>
      ),
    },
  ];

  // --- Wizard navigation with validation ---
  const handleNext = useCallback(() => {
    if (wizardStep === 0 && !canProceedStep0) return;
    if (wizardStep === 1 && !canProceedStep1) return;
    if (wizardStep < wizardSteps.length - 1) {
      setWizardStep((s) => s + 1);
    }
  }, [wizardStep, canProceedStep0, canProceedStep1, wizardSteps.length]);

  const handleBack = useCallback(() => {
    if (wizardStep > 0) {
      setWizardStep((s) => s - 1);
    }
  }, [wizardStep]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <Workflow className="h-5 w-5 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gold/60">
              PVOS Workflow Designer
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Design a Workflow
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          Build your own safety processing pipeline. Pick from templates or
          compose steps from the five{" "}
          <JargonBuster
            term="PVOS operations"
            definition="The five fundamental building blocks of any pharmacovigilance workflow: Detect, Triage, Assess, Report, and Review. Every PV process — no matter how complex — is built from these five operations."
          >
            PVOS operations
          </JargonBuster>
          : Detect, Triage, Assess, Report, and Review.
        </p>
      </header>

      {/* Wizard */}
      <StepWizard
        steps={wizardSteps}
        currentStep={wizardStep}
        onNext={handleNext}
        onBack={handleBack}
      />
    </div>
  );
}
