import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { TrackedLink } from "@/components/analytics/tracked-link";
import demoData from "@/data/station-demo.json";

export const metadata = createMetadata({
  title: "Signal Investigation Demo — Semaglutide + Pancreatitis",
  description:
    "Live pharmacovigilance signal investigation using AlgoVigilance Station. 4 drug-event pairs, 6 algorithms, 20M FAERS reports. Every number computed, not asserted.",
  path: "/station/demo",
  imageAlt: "AlgoVigilance Station — Signal Investigation Demo",
});

const STATION_TOOLS_URL = "https://mcp.nexvigilant.com/tools";

async function getPublicToolCount(): Promise<number> {
  try {
    const res = await fetch(STATION_TOOLS_URL, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return 199;
    const tools: unknown[] = await res.json();
    return tools.length;
  } catch {
    return 199;
  }
}

const metrics = demoData.metrics;
const convergenceData = demoData.convergence;

const dataSources = [
  { name: "FAERS", tool: "search_adverse_events", domain: "api.fda.gov" },
  {
    name: "OpenVigil",
    tool: "compute_disproportionality",
    domain: "open-vigil.fr",
  },
  {
    name: "DailyMed",
    tool: "get_adverse_reactions",
    domain: "dailymed.nlm.nih.gov",
  },
  {
    name: "PubMed",
    tool: "search_case_reports",
    domain: "pubmed.ncbi.nlm.nih.gov",
  },
  { name: "RxNav", tool: "get_rxcui", domain: "rxnav.nlm.nih.gov" },
  {
    name: "AlgoVigilance Compute",
    tool: "compute_prr / compute_ror / compute_ic / compute_ebgm",
    domain: "calculate.nexvigilant.com",
  },
];

function SignalBadge({ detected }: { detected: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        detected
          ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
          : "bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20"
      }`}
    >
      {detected ? "SIGNAL DETECTED" : "NO SIGNAL"}
    </span>
  );
}

function MetricCell({
  value,
  threshold,
  unit,
}: {
  value: number;
  threshold: number;
  unit?: string;
}) {
  const above = value >= threshold;
  return (
    <td
      className={`px-4 py-3 text-sm tabular-nums ${above ? "text-red-400 font-medium" : "text-zinc-400"}`}
    >
      {value.toFixed(2)}
      {unit}
    </td>
  );
}

export default async function StationDemoPage() {
  const toolCount = await getPublicToolCount();
  const maxPrr = Math.max(...convergenceData.map((d) => d.prr));

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Investigation Pipeline */}
      <div className="mb-12">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-zinc-500 text-center">
          6-Step Signal Investigation Pipeline
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            {
              step: "1",
              label: "Resolve Drug",
              tool: "RxNav",
              color: "border-cyan-700 text-cyan-400",
            },
            {
              step: "2",
              label: "Query FAERS",
              tool: "openFDA",
              color: "border-cyan-700 text-cyan-400",
            },
            {
              step: "3",
              label: "Disproportionality",
              tool: "OpenVigil",
              color: "border-amber-700 text-amber-400",
            },
            {
              step: "4",
              label: "Label Check",
              tool: "DailyMed",
              color: "border-amber-700 text-amber-400",
            },
            {
              step: "5",
              label: "Literature",
              tool: "PubMed",
              color: "border-red-800 text-red-400",
            },
            {
              step: "6",
              label: "Verdict",
              tool: "AlgoVigilance",
              color: "border-red-800 text-red-400",
            },
          ].map((s, i, arr) => (
            <div key={s.step} className="flex items-center gap-2">
              <div
                className={`rounded-lg border px-3 py-2 text-center ${s.color}`}
              >
                <div className="text-xs font-mono opacity-60">
                  Step {s.step}
                </div>
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs opacity-50">{s.tool}</div>
              </div>
              {i < arr.length - 1 && (
                <span className="text-zinc-700 font-mono">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="mb-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-cyan-400">
          AlgoVigilance Station Demo
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Signal Investigation: Semaglutide + Pancreatitis
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          A complete pharmacovigilance signal investigation using {toolCount}{" "}
          free tools across 20 million+ FAERS reports. Every number below was
          computed live by AlgoVigilance Station — not asserted from training
          data.
        </p>
      </div>

      {/* Data Sources */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">Data Sources</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dataSources.map((ds) => (
            <div
              key={ds.name}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="text-sm font-medium text-white">{ds.name}</div>
              <div className="mt-1 font-mono text-xs text-zinc-500">
                {ds.tool}
              </div>
              <div className="mt-0.5 text-xs text-zinc-600">{ds.domain}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Results Table */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">
          4 Drug-Event Pairs — Same Equation, Four Boundaries
        </h2>
        <p className="mb-6 text-zinc-400">
          PRR, ROR, IC, and EBGM are not four independent tests. They are a
          single conservation law evaluated with four different boundary
          operators. They share the same 2&times;2 contingency table. They
          differ only in how they measure departure from the expected.
        </p>

        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left">
            <thead className="border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-zinc-300">
                  Drug + Event
                </th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-300">
                  Reports
                </th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-300">
                  PRR
                  <span className="ml-1 text-xs text-zinc-600">(&ge;2.0)</span>
                </th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-300">
                  ROR
                  <span className="ml-1 text-xs text-zinc-600">(CI&gt;1)</span>
                </th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-300">
                  IC
                  <span className="ml-1 text-xs text-zinc-600">(&gt;0)</span>
                </th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-300">
                  EBGM
                  <span className="ml-1 text-xs text-zinc-600">(&ge;2)</span>
                </th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-300">
                  Naranjo
                </th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-300">
                  Signal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {metrics.map((m) => (
                <tr
                  key={`${m.drug}-${m.event}`}
                  className="hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">
                      {m.drug}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {m.event} ({m.year})
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-zinc-300">
                    {m.reports.toLocaleString()}
                  </td>
                  <MetricCell value={m.prr} threshold={2.0} />
                  <MetricCell value={m.ror} threshold={1.0} />
                  <MetricCell value={m.ic} threshold={0} />
                  <MetricCell value={m.ebgm} threshold={2.0} />
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-zinc-300">
                      {m.naranjo}/13
                    </span>
                    <span
                      className={`ml-1.5 text-xs ${m.naranjoLabel === "PROBABLE" ? "text-amber-400" : "text-zinc-500"}`}
                    >
                      {m.naranjoLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SignalBadge detected={m.signal} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Convergence Series */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">
          PRR Convergence: 2018&ndash;2025
        </h2>
        <p className="mb-6 text-zinc-400">
          Semaglutide was approved December 2017. The PRR spiked to 11.3 in 2020
          (small-denominator effect), then converged to 6.9 as the Wegovy
          obesity indication massively expanded the prescribing base. The signal
          was detected in every single year — never borderline.
        </p>

        {/* Simple bar chart via CSS */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="space-y-3">
            {convergenceData.map((d) => (
              <div key={d.year} className="flex items-center gap-4">
                <span className="w-12 text-right text-sm tabular-nums text-zinc-400">
                  {d.year}
                </span>
                <div className="flex-1">
                  <div
                    className="h-6 rounded bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all"
                    style={{ width: `${(d.prr / maxPrr) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-right text-sm tabular-nums text-zinc-300">
                  PRR {d.prr.toFixed(2)}
                </span>
                <span className="w-24 text-right text-xs tabular-nums text-zinc-600">
                  n={d.cases.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-4">
            <div className="h-px flex-1 bg-red-500/30" />
            <span className="text-xs text-red-400/60">
              Signal threshold: PRR &ge; 2.0
            </span>
            <div className="h-px flex-1 bg-red-500/30" />
          </div>
        </div>
      </section>

      {/* Conservation Law Frame */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">
          The Conservation Law Frame
        </h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="mb-4 text-zinc-300">
            All four disproportionality measures are instances of a single
            equation:
          </p>
          <div className="mb-6 rounded bg-zinc-800/50 px-4 py-3 text-center font-mono text-lg text-cyan-400">
            Existence = Boundary(Product(State, Nothing))
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="px-4 py-2 text-zinc-300">Metric</th>
                  <th className="px-4 py-2 text-zinc-300">Boundary Operator</th>
                  <th className="px-4 py-2 text-zinc-300">Scale</th>
                  <th className="px-4 py-2 text-zinc-300">Null Value</th>
                  <th className="px-4 py-2 text-zinc-300">What It Adds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <tr>
                  <td className="px-4 py-2 font-medium text-white">PRR</td>
                  <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                    ratio = a/(a+b) / c/(c+d)
                  </td>
                  <td className="px-4 py-2 text-zinc-400">Linear</td>
                  <td className="px-4 py-2 tabular-nums text-zinc-400">1.0</td>
                  <td className="px-4 py-2 text-zinc-500">Raw departure</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-white">ROR</td>
                  <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                    odds = ad/bc
                  </td>
                  <td className="px-4 py-2 text-zinc-400">Odds</td>
                  <td className="px-4 py-2 tabular-nums text-zinc-400">1.0</td>
                  <td className="px-4 py-2 text-zinc-500">
                    Prevalence correction
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-white">IC</td>
                  <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                    info = log2(O/E)
                  </td>
                  <td className="px-4 py-2 text-zinc-400">Bits</td>
                  <td className="px-4 py-2 tabular-nums text-zinc-400">0.0</td>
                  <td className="px-4 py-2 text-zinc-500">
                    Information surprise
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-white">EBGM</td>
                  <td className="px-4 py-2 font-mono text-xs text-zinc-400">
                    bayes = posterior/prior
                  </td>
                  <td className="px-4 py-2 text-zinc-400">Bayesian</td>
                  <td className="px-4 py-2 tabular-nums text-zinc-400">1.0</td>
                  <td className="px-4 py-2 text-zinc-500">Sample size trust</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            You don&apos;t run four tests. You run one equation four ways. The
            metrics agree on direction (signal or not) but disagree on magnitude
            — because each boundary adds a different form of epistemic caution.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">Try It Yourself</h2>
        <p className="mb-8 text-zinc-400">
          All {toolCount} tools used in this investigation are free and
          available now via MCP protocol. Connect any AI agent to our endpoint.
        </p>
        <div className="mx-auto max-w-xl rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            MCP Endpoint
          </div>
          <code className="text-lg text-cyan-400">
            https://mcp.nexvigilant.com/mcp
          </code>
          <div className="mt-2 text-xs text-zinc-600">
            Streamable HTTP &middot; No auth required &middot; {toolCount}{" "}
            public tools
          </div>
        </div>
      </section>

      {/* Academy backlink — Glass Bridge reverse direction */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left md:gap-8">
          <div className="flex-1">
            <p className="text-xs font-mono uppercase tracking-widest text-gold/60 mb-2">
              Build the Competency
            </p>
            <h3 className="text-lg font-semibold text-white mb-2">
              Want to understand what you just saw?
            </h3>
            <p className="text-sm text-zinc-400">
              The PV Academy maps 1,286 competencies across 15 domains to
              structured learning pathways. Signal detection, causality
              assessment, benefit-risk — all taught with the same live tools you
              just ran.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <TrackedLink
              href="/auth/signup"
              event="signup_started"
              properties={{ location: "station_demo_bottom" }}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-black hover:bg-gold/90 transition-colors"
            >
              Join Academy — It&apos;s Free
              <ArrowRight className="h-4 w-4" />
            </TrackedLink>
            <Link
              href="/capabilities"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-6 py-3 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Full Capabilities
            </Link>
          </div>
        </div>
      </section>

      {/* Footer attribution */}
      <div className="mt-16 border-t border-zinc-800 pt-8 text-center text-xs text-zinc-600">
        <p>
          Data: FAERS (20M+ reports), OpenVigil France, DailyMed, PubMed, RxNav,
          ClinicalTrials.gov
        </p>
        <p className="mt-1">
          Verified by AlgoVigilance Station ({toolCount} public tools). Signal
          data computed{" "}
          {new Date(demoData.generatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          . Tool count refreshed daily.
        </p>
      </div>
    </div>
  );
}
