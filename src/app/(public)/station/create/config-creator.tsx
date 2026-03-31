"use client";

import { useCallback, useMemo, useState } from "react";
import { StepWizard } from "@/components/pv-for-nexvigilants";
import {
  Hammer,
  Plus,
  Trash2,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types — mirrors HubConfig / ToolDef / ParamDef from station config.rs
// All fields match the canonical Rust schema in crates/station/src/config.rs
// ---------------------------------------------------------------------------

interface ParamDef {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
}

interface OutputSchema {
  type: string;
  properties: Record<string, { type: string; description?: string }>;
  required?: string[];
  items?: Record<string, unknown>;
}

interface ToolDef {
  name: string;
  description: string;
  parameters: ParamDef[];
  outputSchema: OutputSchema;
  annotations?: ToolAnnotations;
}

interface HubConfig {
  domain: string;
  url_pattern?: string;
  title: string;
  description?: string;
  proxy?: string;
  private: boolean;
  copyright?: string;
  tools: ToolDef[];
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const EMPTY_PARAM: ParamDef = {
  name: "",
  type: "string",
  description: undefined,
  required: false,
};

const EMPTY_TOOL: ToolDef = {
  name: "",
  description: "",
  parameters: [],
  outputSchema: {
    type: "object",
    properties: { status: { type: "string", description: "ok | error" } },
    required: ["status"],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
};

const PARAM_TYPES = [
  "string",
  "integer",
  "number",
  "boolean",
  "array",
  "object",
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
}

function validate(config: HubConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!config.domain.trim())
    issues.push({ severity: "error", message: "Domain is required" });
  else if (!/^[\w.-]+$/.test(config.domain))
    issues.push({
      severity: "error",
      message: "Domain must be alphanumeric with dots/hyphens",
    });

  if (!config.title.trim())
    issues.push({ severity: "error", message: "Title is required" });

  if (config.tools.length === 0)
    issues.push({
      severity: "error",
      message: "At least one tool is required",
    });

  const toolNames = new Set<string>();
  for (const tool of config.tools) {
    if (!tool.name.trim())
      issues.push({ severity: "error", message: "Tool name cannot be empty" });
    else if (!/^[a-z][a-z0-9-]*$/.test(tool.name))
      issues.push({
        severity: "warning",
        message: `Tool "${tool.name}" should be lowercase kebab-case (e.g., get-data)`,
      });

    if (toolNames.has(tool.name))
      issues.push({
        severity: "error",
        message: `Duplicate tool name: "${tool.name}"`,
      });
    toolNames.add(tool.name);

    if (!tool.description.trim())
      issues.push({
        severity: "warning",
        message: `Tool "${tool.name}" has no description`,
      });

    const paramNames = new Set<string>();
    for (const p of tool.parameters) {
      if (!p.name.trim())
        issues.push({
          severity: "error",
          message: `Parameter in "${tool.name}" has no name`,
        });
      if (paramNames.has(p.name))
        issues.push({
          severity: "error",
          message: `Duplicate param "${p.name}" in "${tool.name}"`,
        });
      if (!PARAM_TYPES.includes(p.type))
        issues.push({
          severity: "error",
          message: `Parameter "${p.name}" in "${tool.name}" has invalid type: "${p.type}"`,
        });
      paramNames.add(p.name);
    }

    const schemaProps = Object.keys(tool.outputSchema.properties);
    if (tool.outputSchema.required) {
      const propsSet = new Set(schemaProps);
      const invalid = tool.outputSchema.required.filter(
        (r) => !propsSet.has(r),
      );
      if (invalid.length > 0)
        issues.push({
          severity: "error",
          message: `OutputSchema required references non-existent fields in "${tool.name}": ${invalid.join(", ")}`,
        });
    }
    if (schemaProps.length === 0)
      issues.push({
        severity: "warning",
        message: `Tool "${tool.name}" has empty outputSchema`,
      });
    else if (!schemaProps.includes("status"))
      issues.push({
        severity: "warning",
        message: `Tool "${tool.name}" outputSchema missing "status" field`,
      });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Shared input styles
// ---------------------------------------------------------------------------

const INPUT =
  "w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-purple-500/50";
const LABEL = "block text-xs font-medium text-white/50 mb-1";
const CARD =
  "rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-colors";

// ---------------------------------------------------------------------------
// Step 1: Config Basics
// ---------------------------------------------------------------------------

function StepBasics({
  config,
  onChange,
}: {
  config: HubConfig;
  onChange: (c: HubConfig) => void;
}) {
  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div>
        <label className={LABEL}>
          Domain <span className="text-amber-400">*</span>
        </label>
        <input
          className={INPUT}
          placeholder="example.nexvigilant.com"
          value={config.domain}
          onChange={(e) => onChange({ ...config, domain: e.target.value })}
        />
        <p className="mt-1 text-[11px] text-white/30">
          The domain prefix for all tool names (e.g.,
          example_nexvigilant_com_tool_name)
        </p>
      </div>

      <div>
        <label className={LABEL}>
          Title <span className="text-amber-400">*</span>
        </label>
        <input
          className={INPUT}
          placeholder="My PV Tools"
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </div>

      <div>
        <label className={LABEL}>Description</label>
        <textarea
          className={`${INPUT} min-h-[80px] resize-y`}
          placeholder="What does this config provide? What data sources does it connect to?"
          value={config.description ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              description: e.target.value || undefined,
            })
          }
        />
      </div>

      <div>
        <label className={LABEL}>URL Pattern</label>
        <input
          className={INPUT}
          placeholder="/my-domain/*"
          value={config.url_pattern ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              url_pattern: e.target.value || undefined,
            })
          }
        />
        <p className="mt-1 text-[11px] text-white/30">
          URL matching pattern for multi-domain routing (optional)
        </p>
      </div>

      <div>
        <label className={LABEL}>Proxy Script</label>
        <input
          className={INPUT}
          placeholder="scripts/my_proxy.py"
          value={config.proxy ?? ""}
          onChange={(e) =>
            onChange({ ...config, proxy: e.target.value || undefined })
          }
        />
        <p className="mt-1 text-[11px] text-white/30">
          Python proxy script path, relative to station root (optional)
        </p>
      </div>

      <div>
        <label className={LABEL}>Copyright</label>
        <input
          className={INPUT}
          placeholder="© 2026 Your Organization"
          value={config.copyright ?? ""}
          onChange={(e) =>
            onChange({
              ...config,
              copyright: e.target.value || undefined,
            })
          }
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
        <input
          type="checkbox"
          checked={config.private}
          onChange={(e) => onChange({ ...config, private: e.target.checked })}
          className="accent-purple-500"
        />
        Private config (excluded from public deployments)
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Tool Builder
// ---------------------------------------------------------------------------

function ParamRow({
  param,
  onChange,
  onRemove,
}: {
  param: ParamDef;
  onChange: (p: ParamDef) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_100px_1fr_auto_auto] items-center gap-2">
      <input
        className={INPUT}
        placeholder="param_name"
        value={param.name}
        onChange={(e) => onChange({ ...param, name: e.target.value })}
      />
      <select
        className={INPUT}
        value={param.type}
        onChange={(e) => onChange({ ...param, type: e.target.value })}
      >
        {PARAM_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        className={INPUT}
        placeholder="Description"
        value={param.description}
        onChange={(e) => onChange({ ...param, description: e.target.value })}
      />
      <label className="flex items-center gap-1 text-[11px] text-white/40 cursor-pointer whitespace-nowrap">
        <input
          type="checkbox"
          checked={param.required}
          onChange={(e) => onChange({ ...param, required: e.target.checked })}
          className="accent-amber-400"
        />
        Req
      </label>
      <button
        type="button"
        onClick={onRemove}
        className="text-red-400/60 hover:text-red-400 transition-colors"
        aria-label="Remove parameter"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function SchemaField({
  name,
  field,
  onChange,
  onRemove,
}: {
  name: string;
  field: { type: string; description?: string };
  onChange: (name: string, f: { type: string; description?: string }) => void;
  onRemove: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_100px_1fr_auto] items-center gap-2">
      <input
        className={INPUT}
        placeholder="field_name"
        value={name}
        onChange={(e) => {
          onRemove(name);
          onChange(e.target.value, field);
        }}
      />
      <select
        className={INPUT}
        value={field.type}
        onChange={(e) => onChange(name, { ...field, type: e.target.value })}
      >
        {PARAM_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        className={INPUT}
        placeholder="Description"
        value={field.description ?? ""}
        onChange={(e) =>
          onChange(name, { ...field, description: e.target.value })
        }
      />
      <button
        type="button"
        onClick={() => onRemove(name)}
        className="text-red-400/60 hover:text-red-400 transition-colors"
        aria-label="Remove field"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ToolEditor({
  tool,
  index,
  onChange,
  onRemove,
}: {
  tool: ToolDef;
  index: number;
  onChange: (t: ToolDef) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateParam = (pi: number, p: ParamDef) => {
    const params = [...tool.parameters];
    params[pi] = p;
    onChange({ ...tool, parameters: params });
  };

  const removeParam = (pi: number) => {
    onChange({
      ...tool,
      parameters: tool.parameters.filter((_, i) => i !== pi),
    });
  };

  const addParam = () => {
    onChange({
      ...tool,
      parameters: [...tool.parameters, { ...EMPTY_PARAM }],
    });
  };

  const updateSchemaField = (
    name: string,
    field: { type: string; description?: string },
  ) => {
    const props = { ...tool.outputSchema.properties };
    props[name] = field;
    onChange({
      ...tool,
      outputSchema: { ...tool.outputSchema, properties: props },
    });
  };

  const removeSchemaField = (name: string) => {
    const props = { ...tool.outputSchema.properties };
    delete props[name];
    onChange({
      ...tool,
      outputSchema: { ...tool.outputSchema, properties: props },
    });
  };

  const addSchemaField = () => {
    const props = { ...tool.outputSchema.properties };
    let key = "new_field";
    let i = 1;
    while (key in props) {
      key = `new_field_${i++}`;
    }
    props[key] = { type: "string" };
    onChange({
      ...tool,
      outputSchema: { ...tool.outputSchema, properties: props },
    });
  };

  return (
    <div className={CARD}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <span className="font-mono text-sm font-medium text-purple-400">
          {tool.name || `tool-${index + 1}`}
        </span>
        <span className="flex-1 truncate text-xs text-white/30">
          {tool.description.slice(0, 80)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-400/40 hover:text-red-400 transition-colors"
          aria-label="Remove tool"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-4 pl-7">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>
                Name <span className="text-amber-400">*</span>
              </label>
              <input
                className={INPUT}
                placeholder="get-data"
                value={tool.name}
                onChange={(e) => onChange({ ...tool, name: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-[11px] text-white/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tool.annotations?.readOnlyHint ?? true}
                  onChange={(e) =>
                    onChange({
                      ...tool,
                      annotations: {
                        ...tool.annotations,
                        readOnlyHint: e.target.checked,
                      },
                    })
                  }
                  className="accent-emerald-500"
                />
                Read-only
              </label>
              <label className="flex items-center gap-2 text-[11px] text-white/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tool.annotations?.destructiveHint ?? false}
                  onChange={(e) =>
                    onChange({
                      ...tool,
                      annotations: {
                        ...tool.annotations,
                        destructiveHint: e.target.checked,
                      },
                    })
                  }
                  className="accent-red-500"
                />
                Destructive
              </label>
              <label className="flex items-center gap-2 text-[11px] text-white/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tool.annotations?.openWorldHint ?? false}
                  onChange={(e) =>
                    onChange({
                      ...tool,
                      annotations: {
                        ...tool.annotations,
                        openWorldHint: e.target.checked,
                      },
                    })
                  }
                  className="accent-cyan-500"
                />
                Open-world
              </label>
            </div>
          </div>

          <div>
            <label className={LABEL}>Description</label>
            <textarea
              className={`${INPUT} min-h-[60px] resize-y`}
              placeholder="What does this tool do?"
              value={tool.description}
              onChange={(e) =>
                onChange({ ...tool, description: e.target.value })
              }
            />
          </div>

          {/* Parameters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/50">
                Parameters
              </span>
              <button
                type="button"
                onClick={addParam}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            {tool.parameters.length > 0 && (
              <div className="mb-2 grid grid-cols-[1fr_100px_1fr_auto_auto] gap-2 text-[10px] text-white/30 uppercase tracking-wider">
                <span>Name</span>
                <span>Type</span>
                <span>Description</span>
                <span>Req</span>
                <span />
              </div>
            )}
            <div className="flex flex-col gap-2">
              {tool.parameters.map((p, pi) => (
                <ParamRow
                  key={pi}
                  param={p}
                  onChange={(np) => updateParam(pi, np)}
                  onRemove={() => removeParam(pi)}
                />
              ))}
            </div>
          </div>

          {/* Output Schema */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/50">
                Output Schema
              </span>
              <button
                type="button"
                onClick={addSchemaField}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add field
              </button>
            </div>
            {Object.keys(tool.outputSchema.properties).length > 0 && (
              <div className="mb-2 grid grid-cols-[1fr_100px_1fr_auto] gap-2 text-[10px] text-white/30 uppercase tracking-wider">
                <span>Field</span>
                <span>Type</span>
                <span>Description</span>
                <span />
              </div>
            )}
            <div className="flex flex-col gap-2">
              {Object.entries(tool.outputSchema.properties).map(
                ([name, field]) => (
                  <SchemaField
                    key={name}
                    name={name}
                    field={field}
                    onChange={updateSchemaField}
                    onRemove={removeSchemaField}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepTools({
  config,
  onChange,
}: {
  config: HubConfig;
  onChange: (c: HubConfig) => void;
}) {
  const addTool = () => {
    onChange({ ...config, tools: [...config.tools, { ...EMPTY_TOOL }] });
  };

  const updateTool = (index: number, tool: ToolDef) => {
    const tools = [...config.tools];
    tools[index] = tool;
    onChange({ ...config, tools });
  };

  const removeTool = (index: number) => {
    onChange({ ...config, tools: config.tools.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">
          {config.tools.length} tool{config.tools.length !== 1 ? "s" : ""}{" "}
          defined
        </p>
        <button
          type="button"
          onClick={addTool}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Tool
        </button>
      </div>
      {config.tools.map((tool, i) => (
        <ToolEditor
          key={i}
          tool={tool}
          index={i}
          onChange={(t) => updateTool(i, t)}
          onRemove={() => removeTool(i)}
        />
      ))}
      {config.tools.length === 0 && (
        <div className={`${CARD} text-center py-12`}>
          <p className="text-white/30 mb-3">No tools yet</p>
          <button
            type="button"
            onClick={addTool}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 px-4 py-2 text-sm text-purple-400 hover:bg-purple-500/10 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add your first tool
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Review & Validate
// ---------------------------------------------------------------------------

function StepReview({ config }: { config: HubConfig }) {
  const issues = validate(config);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="flex flex-col gap-4">
      {/* Validation summary */}
      <div className={CARD}>
        <h4 className="text-sm font-medium text-white/70 mb-3">Validation</h4>
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Check className="h-4 w-4" /> All checks passed
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {errors.map((issue, i) => (
              <div
                key={`e${i}`}
                className="flex items-start gap-2 text-sm text-red-400"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {issue.message}
              </div>
            ))}
            {warnings.map((issue, i) => (
              <div
                key={`w${i}`}
                className="flex items-start gap-2 text-sm text-amber-400"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {issue.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className={CARD}>
          <p className="text-[11px] text-white/30 uppercase tracking-wider">
            Tools
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {config.tools.length}
          </p>
        </div>
        <div className={CARD}>
          <p className="text-[11px] text-white/30 uppercase tracking-wider">
            Parameters
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {config.tools.reduce((s, t) => s + t.parameters.length, 0)}
          </p>
        </div>
        <div className={CARD}>
          <p className="text-[11px] text-white/30 uppercase tracking-wider">
            Schema Fields
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {config.tools.reduce(
              (s, t) => s + Object.keys(t.outputSchema.properties).length,
              0,
            )}
          </p>
        </div>
      </div>

      {/* Preview table */}
      <div className={CARD}>
        <h4 className="text-sm font-medium text-white/70 mb-3">Tool Summary</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-white/30 uppercase tracking-wider border-b border-white/10">
                <th className="pb-2 text-left font-medium">Name</th>
                <th className="pb-2 text-left font-medium">Params</th>
                <th className="pb-2 text-left font-medium">Schema</th>
                <th className="pb-2 text-left font-medium">Annotations</th>
              </tr>
            </thead>
            <tbody>
              {config.tools.map((tool) => (
                <tr
                  key={tool.name}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-2 font-mono text-purple-400">
                    {tool.name || "(unnamed)"}
                  </td>
                  <td className="py-2 text-white/50">
                    {tool.parameters.length}
                  </td>
                  <td className="py-2 text-white/50">
                    {Object.keys(tool.outputSchema.properties).length} fields
                  </td>
                  <td className="py-2 text-white/50">
                    {tool.annotations?.readOnlyHint && (
                      <span className="text-emerald-400/60 text-xs mr-2">
                        read-only
                      </span>
                    )}
                    {tool.annotations?.destructiveHint && (
                      <span className="text-red-400/60 text-xs mr-2">
                        destructive
                      </span>
                    )}
                    {tool.annotations?.openWorldHint && (
                      <span className="text-cyan-400/60 text-xs">
                        open-world
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Export
// ---------------------------------------------------------------------------

function StepExport({ config }: { config: HubConfig }) {
  const [copied, setCopied] = useState(false);
  const issues = validate(config);
  const hasErrors = issues.some((i) => i.severity === "error");

  // Clean export: strip undefined/empty optional fields so JSON matches
  // what the Rust station binary expects (Option<String> = null, not "")
  const json = useMemo(() => {
    const clean = {
      domain: config.domain,
      ...(config.url_pattern ? { url_pattern: config.url_pattern } : {}),
      title: config.title,
      ...(config.description ? { description: config.description } : {}),
      ...(config.proxy ? { proxy: config.proxy } : {}),
      ...(config.private ? { private: true } : {}),
      ...(config.copyright ? { copyright: config.copyright } : {}),
      tools: config.tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters.map((p) => ({
          name: p.name,
          type: p.type,
          ...(p.description ? { description: p.description } : {}),
          required: p.required,
        })),
        outputSchema: t.outputSchema,
        annotations: t.annotations,
      })),
    };
    return JSON.stringify(clean, null, 2);
  }, [config]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [json]);

  const handleDownload = useCallback(() => {
    const slug = config.domain.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [json, config.domain]);

  return (
    <div className="flex flex-col gap-4">
      {hasErrors && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">
          <AlertTriangle className="inline h-4 w-4 mr-1" />
          Config has validation errors. Go back to fix them before exporting.
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          disabled={hasErrors}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy JSON"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={hasErrors}
          className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 px-4 py-2 text-sm text-purple-400 transition-colors hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Download className="h-4 w-4" /> Download
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 p-4 overflow-auto max-h-[500px]">
        <pre className="font-mono text-xs text-white/70 whitespace-pre">
          {json}
        </pre>
      </div>

      <div className={CARD}>
        <h4 className="text-sm font-medium text-white/70 mb-2">Next steps</h4>
        <ol className="list-decimal list-inside text-sm text-white/50 space-y-1">
          <li>
            Save the JSON file to your station&apos;s{" "}
            <code className="text-purple-400">configs/</code> directory
          </li>
          <li>
            Write a proxy script in{" "}
            <code className="text-purple-400">scripts/</code> that handles each
            tool
          </li>
          <li>
            Run{" "}
            <code className="text-purple-400">
              cargo test -p nexvigilant-station
            </code>{" "}
            to verify routing
          </li>
          <li>
            Deploy with{" "}
            <code className="text-purple-400">
              gcloud run deploy nexvigilant-station --source .
            </code>
          </li>
        </ol>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Creator Component
// ---------------------------------------------------------------------------

export function ConfigCreator() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<HubConfig>({
    domain: "",
    title: "",
    description: "",
    private: false,
    tools: [],
  });

  const steps = useMemo(
    () => [
      {
        title: "Config Basics",
        description:
          "Name your config and set the domain. This identifies your tool collection on the MCP network.",
        content: <StepBasics config={config} onChange={setConfig} />,
      },
      {
        title: "Build Tools",
        description:
          "Define the tools your config exposes. Each tool has a name, parameters, and an output schema.",
        content: <StepTools config={config} onChange={setConfig} />,
      },
      {
        title: "Review",
        description:
          "Validate your config against MCP spec requirements before exporting.",
        content: <StepReview config={config} />,
      },
      {
        title: "Export",
        description:
          "Download your config as JSON, ready to deploy to any AlgoVigilance Station instance.",
        content: <StepExport config={config} />,
      },
    ],
    [config],
  );

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-purple-400/30 bg-purple-400/5">
            <Hammer className="h-5 w-5 text-purple-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-purple-400/60">
              AlgoVigilance Station
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Config Creator
            </h1>
          </div>
        </div>
        <p className="text-sm text-white/50 max-w-xl leading-relaxed">
          Build an MCP tool config for AlgoVigilance Station. Define your domain,
          add tools with typed parameters and output schemas, validate against
          the MCP spec, and export ready-to-deploy JSON.
        </p>
        <div className="mt-2">
          <Link
            href="/station"
            className="text-xs text-purple-400/60 hover:text-purple-400 transition-colors"
          >
            &larr; Back to Station Dashboard
          </Link>
        </div>
      </header>

      <StepWizard
        steps={steps}
        currentStep={step}
        onNext={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
        onBack={() => setStep((s) => Math.max(s - 1, 0))}
      />
    </div>
  );
}
