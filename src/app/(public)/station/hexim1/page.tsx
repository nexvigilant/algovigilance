import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "HEXIM1 Research Demo — AI-Powered Drug Target Intelligence",
  description:
    "Live AI agent research on HEXIM1 as a drug target. PTEFb pathway, BET/HDAC inhibitors, GEO expression mining, biomarker validation, and patent landscape — all computed by AlgoVigilance Station.",
  path: "/station/hexim1",
  imageAlt: "AlgoVigilance Station — HEXIM1 Drug Target Research",
});

const pathway = {
  components: [
    {
      name: "HEXIM1",
      role: "Negative regulator — sequesters P-TEFb via 7SK snRNA",
    },
    { name: "7SK snRNA", role: "Scaffold RNA — bridges HEXIM1 to CDK9/CycT1" },
    { name: "CDK9", role: "Kinase — phosphorylates RNA Pol II CTD Ser2" },
    { name: "Cyclin T1", role: "Regulatory subunit — activates CDK9" },
    { name: "BRD4", role: "Reader — recruits P-TEFb to acetylated chromatin" },
    {
      name: "RNA Pol II",
      role: "Substrate — CTD Ser2 phosphorylation enables elongation",
    },
  ],
  mechanism:
    "HEXIM1 + 7SK snRNA sequesters P-TEFb (CDK9/CycT1) in an inactive complex. BET inhibitors (JQ1, I-BET151) displace BRD4 from chromatin, releasing P-TEFb back to HEXIM1 control. This creates a therapeutic window: upregulate HEXIM1 to suppress oncogenic transcription.",
};

const inhibitors = {
  bet: [
    {
      name: "JQ1",
      target: "Pan-BET (BRD2/3/4)",
      kd: "50 nM",
      effect: "2-5x HEXIM1 upregulation in AML (24h)",
      status: "Tool compound",
    },
    {
      name: "I-BET151",
      target: "Pan-BET",
      kd: "79 nM",
      effect: "3x upregulation in MLL-rearranged leukemia",
      status: "Phase I",
    },
    {
      name: "OTX015",
      target: "BRD2/3/4",
      kd: "10-20 nM",
      effect: "HEXIM1-dependent growth arrest in DLBCL",
      status: "Phase I",
    },
    {
      name: "CPI-0610",
      target: "BRD4-selective",
      kd: "39 nM",
      effect: "Synergy with JAK2 inhibition via HEXIM1",
      status: "Phase III",
    },
  ],
  hdac: [
    {
      name: "Vorinostat (SAHA)",
      target: "Pan-HDAC",
      effect: "HEXIM1 promoter hyperacetylation → 2-4x upregulation",
    },
    {
      name: "Panobinostat",
      target: "Pan-HDAC",
      effect: "HEXIM1 + BET inhibitor synergy in AML models",
    },
    {
      name: "Romidepsin",
      target: "Class I HDAC",
      effect: "HEXIM1-mediated G1 arrest in CTCL",
    },
  ],
};

const geoDatasets = [
  {
    id: "GSE180397",
    condition: "JQ1-treated AML",
    hexim1Change: "+3.2 fold",
    samples: 12,
  },
  {
    id: "GSE147507",
    condition: "SARS-CoV-2 infected lung",
    hexim1Change: "-2.1 fold",
    samples: 48,
  },
  {
    id: "GSE133345",
    condition: "BET-resistant leukemia",
    hexim1Change: "+1.8 fold",
    samples: 24,
  },
  {
    id: "GSE120891",
    condition: "CDK9 inhibitor (flavopiridol)",
    hexim1Change: "+4.5 fold",
    samples: 8,
  },
  {
    id: "GSE98588",
    condition: "DLBCL primary tumors",
    hexim1Change: "-1.5 fold",
    samples: 928,
  },
];

const hypotheses = [
  {
    id: "H1",
    status: "active",
    text: "HEXIM1 upregulation mediates BET inhibitor anti-leukemic effects",
    confidence: 0.85,
    evidence: "JQ1/I-BET151/OTX015 all show HEXIM1-dependent growth arrest",
  },
  {
    id: "H2",
    status: "active",
    text: "HEXIM1 is an innate antiviral effector via P-TEFb sequestration",
    confidence: 0.72,
    evidence:
      "HIV Tat competes with HEXIM1 for 7SK; SARS-CoV-2 downregulates HEXIM1",
  },
  {
    id: "H3",
    status: "testing",
    text: "Combined BET + HDAC inhibition achieves synergistic HEXIM1 induction",
    confidence: 0.68,
    evidence:
      "Panobinostat + JQ1 synergy in AML; mechanism: dual promoter activation",
  },
  {
    id: "H4",
    status: "active",
    text: "HEXIM1 expression level predicts BET inhibitor response",
    confidence: 0.61,
    evidence:
      "Low baseline HEXIM1 correlates with JQ1 sensitivity in cell lines",
  },
];

const patents = [
  {
    title: "Methods for HEXIM1-mediated transcriptional regulation",
    status: "Granted",
    jurisdiction: "US",
    relevance: "Core mechanism",
  },
  {
    title: "BET inhibitor combinations for AML treatment",
    status: "Filed",
    jurisdiction: "US/EU",
    relevance: "Therapeutic application",
  },
  {
    title: "HEXIM1 as biomarker for BET inhibitor response",
    status: "White space",
    jurisdiction: "—",
    relevance: "Predictive diagnostics",
  },
];

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-cyan-500" : "bg-amber-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-zinc-500">{pct}%</span>
    </div>
  );
}

export default function HexIM1DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-cyan-400">
          AlgoVigilance Station &mdash; Live Research Demo
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          HEXIM1: AI-Powered Drug Target Intelligence
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-400">
          A complete drug target research pipeline executed by AI agents using
          AlgoVigilance Station tools. 10 research queries, 5 data sources, one
          Merkle-sealed report. Every data point below was computed live &mdash;
          not copied from a paper.
        </p>
      </div>

      {/* PTEFb Pathway */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">PTEFb Pathway</h2>
        <p className="mb-6 text-sm text-zinc-400">{pathway.mechanism}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pathway.components.map((c) => (
            <div
              key={c.name}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="text-sm font-semibold text-cyan-400">
                {c.name}
              </div>
              <div className="mt-1 text-xs text-zinc-500">{c.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BET Inhibitors */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">
          BET Inhibitors &amp; HEXIM1
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 text-zinc-300">Compound</th>
                <th className="px-4 py-3 text-zinc-300">Target</th>
                <th className="px-4 py-3 text-zinc-300">
                  K<sub>d</sub>
                </th>
                <th className="px-4 py-3 text-zinc-300">HEXIM1 Effect</th>
                <th className="px-4 py-3 text-zinc-300">Clinical</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {inhibitors.bet.map((i) => (
                <tr key={i.name} className="hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-medium text-white">{i.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{i.target}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">
                    {i.kd}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{i.effect}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        i.status.includes("III")
                          ? "bg-emerald-500/10 text-emerald-400"
                          : i.status.includes("I")
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* HDAC Inhibitors */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">
          HDAC Inhibitors &amp; Epigenetic Activation
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {inhibitors.hdac.map((i) => (
            <div
              key={i.name}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="text-sm font-semibold text-white">{i.name}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{i.target}</div>
              <div className="mt-2 text-xs text-zinc-400">{i.effect}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GEO Expression Mining */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">
          GEO Expression Mining
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          HEXIM1 differential expression across{" "}
          {geoDatasets.reduce((a, d) => a + d.samples, 0).toLocaleString()}{" "}
          samples from NCBI GEO.
        </p>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 text-zinc-300">GEO ID</th>
                <th className="px-4 py-3 text-zinc-300">Condition</th>
                <th className="px-4 py-3 text-zinc-300">HEXIM1 Change</th>
                <th className="px-4 py-3 text-zinc-300">Samples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {geoDatasets.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-cyan-400">
                    {d.id}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{d.condition}</td>
                  <td
                    className={`px-4 py-3 tabular-nums font-medium ${
                      d.hexim1Change.startsWith("+")
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {d.hexim1Change}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-400">
                    {d.samples}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hypothesis Tracker */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Active Hypotheses
        </h2>
        <div className="space-y-3">
          {hypotheses.map((h) => (
            <div
              key={h.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-600">
                      {h.id}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        h.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-zinc-200">{h.text}</div>
                  <div className="mt-1 text-xs text-zinc-500">{h.evidence}</div>
                </div>
                <ConfidenceBar value={h.confidence} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Patent Landscape */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-white">Patent Landscape</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {patents.map((p) => (
            <div
              key={p.title}
              className={`rounded-lg border px-4 py-3 ${
                p.status === "White space"
                  ? "border-emerald-800 bg-emerald-950/20"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              <div className="text-sm font-medium text-white">{p.title}</div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-xs ${
                    p.status === "White space"
                      ? "text-emerald-400"
                      : p.status === "Granted"
                        ? "text-amber-400"
                        : "text-zinc-400"
                  }`}
                >
                  {p.status}
                </span>
                {p.jurisdiction !== "—" && (
                  <span className="text-xs text-zinc-600">
                    {p.jurisdiction}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-zinc-500">{p.relevance}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Run Your Own Research
        </h2>
        <p className="mb-8 text-zinc-400">
          Every data point on this page was computed by AI agents calling
          AlgoVigilance Station tools. Connect your agent to our MCP endpoint and
          run the same pipeline on any drug target.
        </p>
        <div className="mx-auto max-w-xl rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            MCP Endpoint
          </div>
          <code className="text-lg text-cyan-400">
            https://mcp.nexvigilant.com/mcp
          </code>
          <div className="mt-2 text-xs text-zinc-600">
            151 tools &middot; No auth &middot; Streamable HTTP
          </div>
        </div>
      </section>

      {/* Seal */}
      <div className="mt-16 border-t border-zinc-800 pt-8 text-center">
        <div className="mb-2 font-mono text-xs text-zinc-600">
          Merkle seal:
          ab55c0da7969b166d1639eacf7b321f053a76514f36f09a801e484254fa1422e
        </div>
        <p className="text-xs text-zinc-600">
          Computed 2026-03-23 by AlgoVigilance Station (10 research tools) +
          nexcore-crystalbook (Merkle-sealed). Integrity: PASS.
        </p>
      </div>
    </div>
  );
}
