import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import {
  ShieldCheck,
  ArrowLeft,
  Terminal,
  Code2,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Guardian API Quickstart",
  description:
    "Get started with the Guardian Signal Detection API. cURL, TypeScript, and R examples with sample request and response JSON.",
  path: "/guardian/docs/quickstart",
});

/** Inline code block — no syntax highlighting dependency required */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.1]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/[0.08]">
        <span className="text-xs text-slate-dim font-mono uppercase tracking-wide">
          {lang}
        </span>
      </div>
      <pre className="p-5 text-sm leading-relaxed text-slate-light overflow-x-auto bg-white/[0.02]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CURL_EXAMPLE = `curl -X POST https://api.nexvigilant.com/v1/signal/detect \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "drug": "metformin",
    "event": "lactic acidosis",
    "algorithms": ["prr", "ror", "ic", "ebgm"],
    "dataset": "faers_2024_q4"
  }'`;

const TS_EXAMPLE = `const response = await fetch(
  'https://api.nexvigilant.com/v1/signal/detect',
  {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.GUARDIAN_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      drug: 'metformin',
      event: 'lactic acidosis',
      algorithms: ['prr', 'ror', 'ic', 'ebgm'],
      dataset: 'faers_2024_q4',
    }),
  }
);

const result = await response.json();
console.log(result.signals);`;

const R_EXAMPLE = `library(httr)
library(jsonlite)

response <- POST(
  url = "https://api.nexvigilant.com/v1/signal/detect",
  add_headers(
    Authorization = paste("Bearer", Sys.getenv("GUARDIAN_API_KEY")),
    "Content-Type" = "application/json"
  ),
  body = toJSON(list(
    drug      = "metformin",
    event     = "lactic acidosis",
    algorithms = c("prr", "ror", "ic", "ebgm"),
    dataset   = "faers_2024_q4"
  ), auto_unbox = TRUE),
  encode = "raw"
)

result <- content(response, "parsed")
print(result$signals)`;

const REQUEST_JSON = `{
  "drug": "metformin",
  "event": "lactic acidosis",
  "algorithms": ["prr", "ror", "ic", "ebgm"],
  "dataset": "faers_2024_q4"
}`;

const RESPONSE_JSON = `{
  "status": "ok",
  "drug": "metformin",
  "event": "lactic acidosis",
  "dataset": "faers_2024_q4",
  "n_cases": 247,
  "signals": {
    "prr": {
      "value": 3.42,
      "lower_ci_95": 2.98,
      "upper_ci_95": 3.91,
      "p_value": 0.0003,
      "threshold_exceeded": true
    },
    "ror": {
      "value": 3.61,
      "lower_ci_95": 3.12,
      "upper_ci_95": 4.17,
      "p_value": 0.0001,
      "threshold_exceeded": true
    },
    "ic": {
      "value": 1.87,
      "ic_025": 1.42,
      "threshold_exceeded": true
    },
    "ebgm": {
      "value": 3.15,
      "eb05": 2.67,
      "threshold_exceeded": true
    }
  },
  "latency_ms": 38
}`;

const CAUSALITY_JSON = `{
  "drug": "metformin",
  "event": "lactic acidosis",
  "patient_narrative": "...",
  "naranjo": {
    "score": 7,
    "classification": "probable",
    "subscores": { ... }
  },
  "who_umc": {
    "classification": "probable",
    "criteria_met": ["temporal_association", "dechallenge_positive"]
  }
}`;

export default function GuardianQuickstartPage() {
  return (
    <div className="min-h-screen bg-nex-background">
      {/* ── Docs header ──────────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.08] py-4 px-4 sticky top-0 z-10 bg-nex-background/95 backdrop-blur">
        <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck
              className="h-5 w-5 text-cyan flex-shrink-0"
              aria-hidden="true"
            />
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/guardian"
                className="text-slate-dim hover:text-white transition-colors"
              >
                Guardian
              </Link>
              <span className="text-slate-dim/40">/</span>
              <Link
                href="/guardian/docs/quickstart"
                className="text-white font-medium"
              >
                Quickstart
              </Link>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/5"
          >
            <Link href="/guardian">
              <ArrowLeft className="mr-2 h-3 w-3" aria-hidden="true" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        {/* Page title */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-white mb-3">
            API Quickstart
          </h1>
          <p className="text-slate-dim text-lg">
            Run your first signal detection in under 5 minutes.
          </p>
        </div>

        {/* Step 1: Get API key */}
        <section className="mb-14" aria-labelledby="step1-heading">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-bold flex-shrink-0">
              1
            </div>
            <h2
              id="step1-heading"
              className="text-xl font-headline font-bold text-white"
            >
              Get an API key
            </h2>
          </div>
          <div className="ml-10">
            <p className="text-slate-dim mb-4">
              Create a free account and generate an API key from your dashboard.
            </p>
            <Button asChild variant="glow" className="mb-4">
              <Link
                href={ROUTES.AUTH.signupWithReturn(
                  ROUTES.NUCLEUS.GUARDIAN.ROOT,
                )}
              >
                Create Free Account
              </Link>
            </Button>
            <p className="text-slate-dim text-sm">
              Your API key will be available at{" "}
              <code className="text-cyan font-mono bg-white/[0.05] px-1 py-0.5 rounded">
                Nucleus → Guardian → API Keys
              </code>
            </p>
          </div>
        </section>

        {/* Step 2: Base URL */}
        <section className="mb-14" aria-labelledby="step2-heading">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-bold flex-shrink-0">
              2
            </div>
            <h2
              id="step2-heading"
              className="text-xl font-headline font-bold text-white"
            >
              Base URL and authentication
            </h2>
          </div>
          <div className="ml-10 space-y-4">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08]">
              <p className="text-xs text-slate-dim uppercase tracking-wide mb-2">
                Base URL
              </p>
              <code className="text-cyan font-mono text-sm">
                https://api.nexvigilant.com/v1
              </code>
            </div>
            <p className="text-slate-dim text-sm">
              Authenticate with{" "}
              <code className="text-cyan font-mono bg-white/[0.05] px-1 py-0.5 rounded">
                Authorization: Bearer YOUR_API_KEY
              </code>{" "}
              on every request.
            </p>
          </div>
        </section>

        {/* Step 3: Signal detection request */}
        <section className="mb-14" aria-labelledby="step3-heading">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-bold flex-shrink-0">
              3
            </div>
            <h2
              id="step3-heading"
              className="text-xl font-headline font-bold text-white"
            >
              Run a signal analysis
            </h2>
          </div>
          <div className="ml-10 space-y-4">
            <p className="text-slate-dim text-sm mb-4">
              <code className="text-cyan font-mono bg-white/[0.05] px-1 py-0.5 rounded">
                POST /signal/detect
              </code>{" "}
              accepts a drug name, adverse event term, list of algorithms, and
              dataset identifier.
            </p>

            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs text-slate-dim uppercase tracking-wide mb-2">
                <Terminal className="h-3 w-3" aria-hidden="true" />
                Request body
              </div>
              <CodeBlock lang="json" code={REQUEST_JSON} />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-dim uppercase tracking-wide mb-3 mt-8">
              <Terminal className="h-3 w-3" aria-hidden="true" />
              Examples
            </div>

            <div className="space-y-4">
              <CodeBlock lang="curl" code={CURL_EXAMPLE} />
              <CodeBlock lang="typescript" code={TS_EXAMPLE} />
              <CodeBlock lang="r" code={R_EXAMPLE} />
            </div>
          </div>
        </section>

        {/* Step 4: Response */}
        <section className="mb-14" aria-labelledby="step4-heading">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-bold flex-shrink-0">
              4
            </div>
            <h2
              id="step4-heading"
              className="text-xl font-headline font-bold text-white"
            >
              Interpret the response
            </h2>
          </div>
          <div className="ml-10 space-y-4">
            <p className="text-slate-dim text-sm mb-4">
              The response includes per-algorithm results, confidence intervals,
              and threshold flags.
            </p>
            <CodeBlock
              lang="json — /signal/detect response"
              code={RESPONSE_JSON}
            />
          </div>
        </section>

        {/* Step 5: Causality assessment */}
        <section className="mb-14" aria-labelledby="step5-heading">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-bold flex-shrink-0">
              5
            </div>
            <h2
              id="step5-heading"
              className="text-xl font-headline font-bold text-white"
            >
              Causality assessment (Professional+)
            </h2>
          </div>
          <div className="ml-10 space-y-4">
            <p className="text-slate-dim text-sm">
              Use{" "}
              <code className="text-cyan font-mono bg-white/[0.05] px-1 py-0.5 rounded">
                POST /causality/assess
              </code>{" "}
              to apply Naranjo and WHO-UMC scales to a patient narrative.
            </p>
            <CodeBlock
              lang="json — /causality/assess response"
              code={CAUSALITY_JSON}
            />
          </div>
        </section>

        {/* Available algorithms reference */}
        <section className="mb-14" aria-labelledby="algos-heading">
          <div className="flex items-center gap-3 mb-5">
            <FlaskConical
              className="h-5 w-5 text-cyan flex-shrink-0"
              aria-hidden="true"
            />
            <h2
              id="algos-heading"
              className="text-xl font-headline font-bold text-white"
            >
              Available algorithm identifiers
            </h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table
              className="w-full text-sm"
              aria-label="Algorithm identifiers"
            >
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th className="text-left px-4 py-3 text-slate-dim font-medium">
                    Identifier
                  </th>
                  <th className="text-left px-4 py-3 text-slate-dim font-medium">
                    Algorithm
                  </th>
                  <th className="text-left px-4 py-3 text-slate-dim font-medium hidden md:table-cell">
                    Tier
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    id: "prr",
                    name: "Proportional Reporting Ratio",
                    tier: "All",
                  },
                  { id: "ror", name: "Reporting Odds Ratio", tier: "All" },
                  { id: "nprr", name: "Normalized PRR", tier: "All" },
                  { id: "yule_q", name: "Yule's Q Coefficient", tier: "All" },
                  {
                    id: "ic",
                    name: "Information Component (BCPNN)",
                    tier: "All",
                  },
                  {
                    id: "ebgm",
                    name: "Empirical Bayes Geometric Mean",
                    tier: "All",
                  },
                  {
                    id: "cusum",
                    name: "CUSUM Sequential Analysis",
                    tier: "Professional+",
                  },
                  {
                    id: "maxsprt",
                    name: "MaxSPRT Sequential Probability",
                    tier: "Professional+",
                  },
                  {
                    id: "cox_ph",
                    name: "Cox Proportional Hazards",
                    tier: "Professional+",
                  },
                  {
                    id: "kaplan_meier",
                    name: "Kaplan-Meier Survival",
                    tier: "Professional+",
                  },
                  {
                    id: "arima",
                    name: "ARIMA Time-to-Onset",
                    tier: "Professional+",
                  },
                  {
                    id: "weibull",
                    name: "Weibull Distribution",
                    tier: "Professional+",
                  },
                  {
                    id: "hdps",
                    name: "High-Dimensional Propensity Score",
                    tier: "Professional+",
                  },
                ].map((algo, i) => (
                  <tr
                    key={algo.id}
                    className={`border-b border-white/[0.05] ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                  >
                    <td className="px-4 py-3 font-mono text-cyan">{algo.id}</td>
                    <td className="px-4 py-3 text-slate-light">{algo.name}</td>
                    <td className="px-4 py-3 text-slate-dim hidden md:table-cell">
                      {algo.tier}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Next steps */}
        <section className="py-10 px-6 rounded-xl border border-white/[0.08] bg-white/[0.03] text-center">
          <Code2
            className="h-8 w-8 text-cyan mx-auto mb-4"
            aria-hidden="true"
          />
          <h2 className="font-headline font-bold text-white text-xl mb-2">
            Ready to build?
          </h2>
          <p className="text-slate-dim text-sm mb-6">
            Free trial includes 50 analyses. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="glow">
              <Link
                href={ROUTES.AUTH.signupWithReturn(
                  ROUTES.NUCLEUS.GUARDIAN.ROOT,
                )}
              >
                Get API Key
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
            >
              <Link href="/guardian#pricing">View Pricing</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
