"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const STATION = "https://mcp.nexvigilant.com";
const MCP = `${STATION}/mcp`;

interface ToolSchema {
  name: string;
  description?: string;
  inputSchema?: {
    properties?: Record<
      string,
      { type?: string; description?: string; default?: unknown }
    >;
    required?: string[];
  };
}

interface ToolResponse {
  status: "pass" | "fail" | "loading";
  duration: number;
  body: string;
  raw: string;
}

interface StationHealth {
  status: string;
  tools: number;
  version: string;
  transport: string;
  telemetry?: {
    total_calls: number;
    calls_per_minute: number;
    error_rate_pct: number;
  };
}

const DOMAIN_LABELS: Record<string, string> = {
  "nexvigilant.meta": "Station Meta",
  "calculate.nexvigilant.com": "PV Compute",
  "vigilance.nexvigilant.com": "PV Vigilance",
  "api.fda.gov": "openFDA FAERS",
  "www.fda.gov": "FDA Safety",
  "accessdata.fda.gov": "FDA Accessdata",
  "dailymed.nlm.nih.gov": "DailyMed",
  "clinicaltrials.gov": "ClinicalTrials",
  "pubmed.ncbi.nlm.nih.gov": "PubMed",
  "rxnav.nlm.nih.gov": "RxNav",
  "open-vigil.fr": "OpenVigil",
  "eudravigilance.ema.europa.eu": "EudraVigilance",
  "www.ema.europa.eu": "EMA",
  "vigiaccess.org": "VigiAccess",
  "who-umc.org": "WHO-UMC",
  "meddra.org": "MedDRA",
  "ich.org": "ICH",
  "cioms.ch": "CIOMS",
  "go.drugbank.com": "DrugBank",
};

const CATEGORIES: Record<string, string[]> = {
  AlgoVigilance: [
    "nexvigilant.meta",
    "calculate.nexvigilant.com",
    "vigilance.nexvigilant.com",
  ],
  "FDA / US": [
    "api.fda.gov",
    "www.fda.gov",
    "accessdata.fda.gov",
    "dailymed.nlm.nih.gov",
  ],
  "EMA / EU": ["eudravigilance.ema.europa.eu", "www.ema.europa.eu"],
  "WHO / Global": ["vigiaccess.org", "who-umc.org"],
  Reference: [
    "clinicaltrials.gov",
    "pubmed.ncbi.nlm.nih.gov",
    "rxnav.nlm.nih.gov",
    "go.drugbank.com",
  ],
  Standards: ["meddra.org", "ich.org", "cioms.ch"],
  Analysis: ["open-vigil.fr"],
};

function getDomain(name: string): string {
  const prefixes = [
    "api_fda_gov",
    "www_fda_gov",
    "accessdata_fda_gov",
    "dailymed_nlm_nih_gov",
    "clinicaltrials_gov",
    "pubmed_ncbi_nlm_nih_gov",
    "rxnav_nlm_nih_gov",
    "eudravigilance_ema_europa_eu",
    "www_ema_europa_eu",
    "vigiaccess_org",
    "meddra_org",
    "ich_org",
    "cioms_ch",
    "go_drugbank_com",
    "calculate_nexvigilant_com",
    "vigilance_nexvigilant_com",
  ];
  if (name.startsWith("nexvigilant_")) return "nexvigilant.meta";
  if (name.includes("open-vigil") || name.includes("open_vigil"))
    return "open-vigil.fr";
  if (name.includes("who-umc") || name.includes("who_umc"))
    return "who-umc.org";
  for (const p of prefixes) {
    if (name.startsWith(p)) return p.replace(/_/g, ".");
  }
  return "unknown";
}

function getShortName(name: string, domain: string): string {
  const prefix = domain.replace(/[.\-]/g, "_");
  if (name.startsWith(prefix + "_")) return name.slice(prefix.length + 1);
  if (name.startsWith("nexvigilant_")) return name.slice(12);
  return name;
}

function ToolCard({ tool, domain }: { tool: ToolSchema; domain: string }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<ToolResponse | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const shortName = getShortName(tool.name, domain);
  const desc = tool.description?.slice(0, 120) ?? "";
  const props = tool.inputSchema?.properties ?? {};
  const required = tool.inputSchema?.required ?? [];
  const paramNames = Object.keys(props);

  const handleRun = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formRef.current) return;

      const params: Record<string, unknown> = {};
      const formData = new FormData(formRef.current);

      for (const pName of paramNames) {
        const spec = props[pName];
        const type = spec.type ?? "string";

        if (type === "boolean") {
          params[pName] = formData.get(pName) === "on";
          continue;
        }

        const val = formData.get(pName) as string;
        if (!val) continue;

        if (type === "integer") params[pName] = parseInt(val, 10);
        else if (type === "number") params[pName] = parseFloat(val);
        else if (type === "array") {
          try {
            params[pName] = JSON.parse(val);
          } catch {
            params[pName] = val;
          }
        } else params[pName] = val;
      }

      setRunning(true);
      setResponse({
        status: "loading",
        duration: 0,
        body: "Calling...",
        raw: "",
      });
      const start = performance.now();

      try {
        const res = await fetch(MCP, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "tools/call",
            params: { name: tool.name, arguments: params },
            id: Date.now(),
          }),
        });

        const elapsed = Math.round(performance.now() - start);
        const data = await res.json();
        const result = data.result ?? {};
        const content = result.content ?? [];
        const isError = result.isError || !!data.error;

        let body = "";
        let raw = "";
        if (data.error) {
          body = JSON.stringify(data.error, null, 2);
          raw = body;
        } else if (content.length > 0) {
          const text = content[0].text ?? "";
          raw = text;
          try {
            body = JSON.stringify(JSON.parse(text), null, 2);
          } catch {
            body = text;
          }
        } else {
          body = "Empty response";
          raw = body;
        }

        setResponse({
          status: isError ? "fail" : "pass",
          duration: elapsed,
          body,
          raw,
        });
      } catch (err) {
        const elapsed = Math.round(performance.now() - start);
        setResponse({
          status: "fail",
          duration: elapsed,
          body: `Connection error: ${err instanceof Error ? err.message : String(err)}`,
          raw: "",
        });
      }

      setRunning(false);
    },
    [tool.name, paramNames, props],
  );

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition-colors hover:border-purple-500/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="font-mono text-sm font-medium text-purple-400">
          {shortName}
        </span>
        <span className="flex-1 truncate text-xs text-white/40">{desc}</span>
        <span
          className={`text-xs text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        >
          &#9660;
        </span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 pb-4">
          <form ref={formRef} onSubmit={handleRun}>
            <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
              {paramNames.length === 0 && (
                <p className="col-span-full text-xs text-white/40">
                  No parameters required
                </p>
              )}
              {paramNames.map((pName) => {
                const spec = props[pName];
                const type = spec.type ?? "string";
                const isReq = required.includes(pName);
                const pdesc = spec.description ?? "";

                return (
                  <div
                    key={pName}
                    className={`flex flex-col gap-1 ${type === "array" ? "col-span-full" : ""}`}
                  >
                    <label className="flex items-center gap-1 text-[11px] font-medium text-white/50">
                      {pName}
                      {isReq && <span className="text-amber-400">*</span>}
                      <span className="opacity-50">{type}</span>
                    </label>
                    {type === "boolean" ? (
                      <input
                        type="checkbox"
                        name={pName}
                        className="w-auto accent-purple-500"
                        title={pdesc}
                      />
                    ) : (
                      <input
                        type={
                          type === "integer" || type === "number"
                            ? "number"
                            : "text"
                        }
                        name={pName}
                        placeholder={pdesc || pName}
                        step={type === "number" ? "any" : undefined}
                        defaultValue={
                          spec.default !== undefined
                            ? String(spec.default)
                            : undefined
                        }
                        className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-purple-500/50"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                disabled={running}
                className="rounded-md bg-purple-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
              >
                {running ? "Running..." : "Run"}
              </button>
              {response && response.status !== "loading" && (
                <span className="font-mono text-xs text-white/40">
                  {response.duration}ms
                </span>
              )}
            </div>
          </form>

          {response && (
            <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/30">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                    response.status === "pass"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : response.status === "loading"
                        ? "bg-purple-500/15 text-purple-400"
                        : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {response.status === "loading"
                    ? "RUNNING"
                    : response.status === "pass"
                      ? `OK (${response.duration}ms)`
                      : "ERROR"}
                </span>
                {response.raw && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(response.raw)}
                    className="rounded border border-white/10 px-2 py-0.5 text-[11px] text-white/40 transition-colors hover:text-white/70"
                  >
                    Copy
                  </button>
                )}
              </div>
              <pre className="max-h-96 overflow-auto p-3 font-mono text-xs leading-relaxed text-white/70">
                {response.body}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function StationDashboard() {
  const [tools, setTools] = useState<ToolSchema[]>([]);
  const [health, setHealth] = useState<StationHealth | null>(null);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const domains = tools.reduce<Record<string, ToolSchema[]>>((acc, t) => {
    const d = getDomain(t.name);
    (acc[d] ??= []).push(t);
    return acc;
  }, {});

  useEffect(() => {
    Promise.all([
      fetch(`${STATION}/health`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${STATION}/tools`)
        .then((r) => r.json())
        .catch(() => []),
    ]).then(([h, t]) => {
      setHealth(h);
      setTools(t);
      setLoading(false);
    });
  }, []);

  const displayTools = search
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.description ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : activeDomain
      ? (domains[activeDomain] ?? [])
      : [];

  const displayGrouped = search
    ? displayTools.reduce<Record<string, ToolSchema[]>>((acc, t) => {
        const d = getDomain(t.name);
        (acc[d] ??= []).push(t);
        return acc;
      }, {})
    : null;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-[#0a0a0f]">
      {/* Header bar */}
      <div className="flex shrink-0 items-center gap-4 border-b border-white/10 bg-white/[0.03] px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">
          <span className="text-purple-400">AlgoVigilance</span> Station
        </h1>

        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/50">
          <div
            className={`h-2 w-2 rounded-full ${health?.status === "ok" ? "bg-emerald-400" : "bg-red-400"}`}
          />
          {loading
            ? "connecting..."
            : health
              ? `${health.status} | ${health.tools} tools`
              : "unreachable"}
        </div>

        {health?.telemetry && (
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/50">
            <span title="Total tool calls">
              {health.telemetry.total_calls.toLocaleString()} calls
            </span>
            <span className="text-white/20">|</span>
            <span title="Calls per minute">
              {health.telemetry.calls_per_minute.toFixed(1)}/min
            </span>
            <span className="text-white/20">|</span>
            <span
              title="Error rate"
              className={
                health.telemetry.error_rate_pct > 5
                  ? "text-red-400"
                  : health.telemetry.error_rate_pct > 1
                    ? "text-amber-400"
                    : "text-emerald-400"
              }
            >
              {health.telemetry.error_rate_pct.toFixed(1)}% errors
            </span>
          </div>
        )}

        <Link
          href="/station/semaglutide"
          className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
        >
          Worked Example
        </Link>
        <Link
          href="/station/connect"
          className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
        >
          Connect Your AI
        </Link>
        <Link
          href="/station/demo"
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/60 transition-colors hover:bg-white/[0.06]"
        >
          Signal Demo
        </Link>

        <div className="ml-auto text-xs text-white/30">
          {loading ? "Loading..." : `${tools.length} tools · ${Object.keys(domains).length} domains`}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="w-64 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-purple-500/50"
        />

        <Link
          href="/station/create"
          className="shrink-0 rounded-lg border border-purple-500/30 px-3 py-1.5 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/10"
        >
          + Create Config
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 overflow-y-auto border-r border-white/10 bg-white/[0.02]">
          {Object.entries(CATEGORIES).map(([cat, domainList]) => (
            <div key={cat} className="py-2">
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {cat}
              </div>
              {domainList.map((d) => {
                if (!domains[d]) return null;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setActiveDomain(d);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between px-4 py-1.5 text-left text-[13px] transition-colors ${
                      activeDomain === d
                        ? "bg-purple-600/20 text-white"
                        : "text-white/60 hover:bg-white/[0.05]"
                    }`}
                  >
                    {DOMAIN_LABELS[d] ?? d}
                    <span
                      className={`rounded-full px-1.5 text-[11px] ${
                        activeDomain === d
                          ? "bg-white/10 text-white"
                          : "bg-white/[0.05] text-white/30"
                      }`}
                    >
                      {domains[d].length}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Main panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {!activeDomain && !search ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <h2 className="text-xl font-semibold text-white">
                PV Knowledge for Everyone
              </h2>
              <p className="max-w-lg text-sm leading-relaxed text-white/40">
                1,900+ pharmacovigilance tools across 229 domains. Search adverse
                events, compute disproportionality signals, assess causality,
                query clinical trials and literature. Free, open, no auth
                required.
              </p>
              <code className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-sm text-purple-400">
                https://mcp.nexvigilant.com/mcp
              </code>
              <div className="mt-4 grid max-w-xl grid-cols-2 gap-3">
                {[
                  [
                    "Claude.ai Connector",
                    "Settings → Connectors → Add",
                    "/mcp endpoint, no auth",
                  ],
                  [
                    "Any MCP Client",
                    "Streamable HTTP or SSE",
                    "POST /mcp • GET /sse",
                  ],
                  ["REST API", "Direct tool calls", "POST /rpc • GET /tools"],
                  ["Health", "Status + telemetry", "GET /health"],
                ].map(([title, line1, line2]) => (
                  <div
                    key={title}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left"
                  >
                    <h3 className="mb-1 text-xs font-medium text-purple-400">
                      {title}
                    </h3>
                    <p className="text-[11px] leading-snug text-white/40">
                      {line1}
                      <br />
                      <code className="text-emerald-400/70">{line2}</code>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : displayGrouped ? (
            <>
              <div className="mb-4 text-sm font-medium text-white/40">
                Search: &quot;{search}&quot; ({displayTools.length} matches)
              </div>
              {Object.entries(displayGrouped).map(([domain, dTools]) => (
                <div key={domain}>
                  <div className="mb-2 mt-4 text-xs font-semibold text-white/30">
                    {DOMAIN_LABELS[domain] ?? domain}
                  </div>
                  {dTools.map((t) => (
                    <ToolCard key={t.name} tool={t} domain={domain} />
                  ))}
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="mb-4 text-sm font-medium text-white/40">
                {DOMAIN_LABELS[activeDomain!] ?? activeDomain} (
                {displayTools.length} tools)
              </div>
              {displayTools.map((t) => (
                <ToolCard key={t.name} tool={t} domain={activeDomain!} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
