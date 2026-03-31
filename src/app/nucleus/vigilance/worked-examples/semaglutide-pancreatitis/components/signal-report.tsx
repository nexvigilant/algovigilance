'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Activity,
  Beaker,
  BookOpen,
  Shield,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TipBox,
  RememberBox,
  WarningBox,
  TechnicalStuffBox,
} from '@/components/pv-for-nexvigilants';

// ---------------------------------------------------------------------------
// Static verdict data from the 2026-03-31 pipeline execution
// ---------------------------------------------------------------------------

const VERDICT = {
  drug: { name: 'Semaglutide', rxcui: '1991302', brands: ['Ozempic', 'Wegovy', 'Rybelsus'] },
  event: 'Pancreatitis',
  faers: { count_openfda: 1468, count_openvigil: 2068, database_size: '20M+' },
  disproportionality: {
    prr: { value: 6.93, ci_lower: 6.63, ci_upper: 7.23 },
    ror: { value: 7.09, ci_lower: 6.78, ci_upper: 7.41 },
    ic: { value: 2.76, ic025: 2.70, ic975: 2.82 },
    chi_squared: 10244.05,
    contingency: { a: 2068, b: 76216, c: 75999, d: 19852706 },
  },
  label: {
    on_label: true,
    section: 'Warnings and Precautions 5.2 — Acute Pancreatitis',
    source: 'DailyMed (Wegovy/Ozempic)',
  },
  literature: {
    count: 5,
    top: [
      { pmid: '41901212', title: 'Psychiatric Adverse Events and Administration Challenges Associated with GLP-1 Receptor Agonists' },
      { pmid: '41639322', title: 'Disproportionality analysis of semaglutide-associated bile-duct cancer: A VigiBase study' },
      { pmid: '41599734', title: 'Comparative Safety of GLP-1 Receptor Agonists Across Gastrointestinal, Renal and Pancreatic Systems' },
    ],
  },
  microgram: {
    causality: 'PROBABLE',
    naranjo_score: 6,
    regulatory_action: 'expedited_report',
    deadline_days: 15,
    reporting_type: '15_day_report',
    chain_duration_us: 52,
    chain: 'signal-consensus-to-action',
  },
  conservation: {
    observed: 0.02641,
    expected: 0.003814,
  },
} as const;

// ---------------------------------------------------------------------------
// Pipeline step component
// ---------------------------------------------------------------------------

interface StepProps {
  number: number;
  title: string;
  icon: React.ReactNode;
  source: string;
  children: React.ReactNode;
  latency?: string;
}

function PipelineStep({ number, title, icon, source, children, latency }: StepProps) {
  return (
    <Card className="border-nex-light bg-nex-surface">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan/10 text-sm font-bold text-cyan">
              {number}
            </div>
            <div className="flex items-center gap-2">
              {icon}
              <CardTitle className="text-lg text-white">{title}</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {latency && (
              <Badge variant="outline" className="border-nex-light text-slate-dim">
                {latency}
              </Badge>
            )}
            <Badge variant="outline" className="border-cyan/30 text-cyan">
              {source}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  subtitle,
  signal,
}: {
  label: string;
  value: string;
  subtitle?: string;
  signal?: boolean;
}) {
  return (
    <div className="rounded-lg border border-nex-light bg-nex-deep/50 p-4">
      <p className="text-sm text-slate-dim">{label}</p>
      <p className={`text-2xl font-bold ${signal ? 'text-gold' : 'text-white'}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-dim">{subtitle}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main report
// ---------------------------------------------------------------------------

export function SemaglutidePancreatitisReport() {
  const [showConservation, setShowConservation] = useState(false);

  const d = VERDICT.disproportionality;
  const obs = VERDICT.conservation.observed;
  const exp = VERDICT.conservation.expected;

  return (
    <div className="min-h-screen bg-nex-deep">
      {/* Header */}
      <header className="border-b border-nex-light bg-nex-surface/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/nucleus/vigilance"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-dim hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Vigilance
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <Badge className="bg-gold/20 text-gold">Worked Example</Badge>
                <Badge className="bg-cyan/20 text-cyan">Signal Confirmed</Badge>
              </div>
              <h1 className="text-3xl font-extrabold font-headline text-white md:text-4xl">
                Semaglutide + Pancreatitis
              </h1>
              <p className="mt-2 text-slate-dim">
                Complete 8-step signal investigation using AlgoVigilance Station MCP tools
              </p>
            </div>
            <div className="hidden rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 md:block">
              <p className="text-sm font-medium text-gold">Verdict</p>
              <p className="text-2xl font-bold text-white">PROBABLE</p>
              <p className="text-xs text-slate-dim">Expedited report — 15 days</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto space-y-6 px-4 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="PRR" value="6.93" subtitle="95% CI: 6.63–7.23" signal />
          <MetricCard label="ROR" value="7.09" subtitle="95% CI: 6.78–7.41" signal />
          <MetricCard label="IC" value="2.76" subtitle="IC025: 2.70" signal />
          <MetricCard label="Cases" value="2,068" subtitle="OpenVigil (20M+ reports)" />
        </div>

        <RememberBox>
          This is a <strong>known, well-characterized signal</strong>. Pancreatitis is already listed
          in semaglutide&apos;s Warnings &amp; Precautions (Section 5.2). The strong disproportionality
          (PRR 6.93) with all four metrics concordant confirms the association is real and ongoing.
        </RememberBox>

        {/* Step 1: Drug Identity */}
        <PipelineStep
          number={1}
          title="Resolve Drug Identity"
          icon={<Beaker className="h-5 w-5 text-cyan" />}
          source="RxNav"
          latency="~1s"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-nex-deep/50 p-3">
              <p className="text-sm text-slate-dim">Canonical Name</p>
              <p className="font-medium text-white">Semaglutide</p>
            </div>
            <div className="rounded-lg bg-nex-deep/50 p-3">
              <p className="text-sm text-slate-dim">RxCUI</p>
              <p className="font-mono font-medium text-white">1991302</p>
            </div>
            <div className="rounded-lg bg-nex-deep/50 p-3">
              <p className="text-sm text-slate-dim">Brand Names</p>
              <p className="font-medium text-white">Ozempic, Wegovy, Rybelsus</p>
            </div>
          </div>
        </PipelineStep>

        {/* Step 2: FAERS */}
        <PipelineStep
          number={2}
          title="Query FAERS Adverse Events"
          icon={<Activity className="h-5 w-5 text-cyan" />}
          source="openFDA"
          latency="~2s"
        >
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <MetricCard label="FAERS Cases (openFDA)" value="1,468" subtitle="Serious pancreatitis reports" />
              <MetricCard label="OpenVigil Confirmed" value="2,068" subtitle="French PV database (20M+ total)" />
            </div>
            <TipBox>
              Semaglutide has over 11,000 nausea reports in FAERS — that&apos;s the #1 reaction.
              Pancreatitis ranks lower by volume but higher by clinical significance.
            </TipBox>
          </div>
        </PipelineStep>

        {/* Step 3: Disproportionality */}
        <PipelineStep
          number={3}
          title="Compute Disproportionality"
          icon={<Activity className="h-5 w-5 text-gold" />}
          source="OpenVigil France"
          latency="~3s"
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard
                label="PRR"
                value={`${d.prr.value}`}
                subtitle={`CI: ${d.prr.ci_lower}–${d.prr.ci_upper}`}
                signal
              />
              <MetricCard
                label="ROR"
                value={`${d.ror.value}`}
                subtitle={`CI: ${d.ror.ci_lower}–${d.ror.ci_upper}`}
                signal
              />
              <MetricCard
                label="IC"
                value={`${d.ic.value}`}
                subtitle={`IC025: ${d.ic.ic025}`}
                signal
              />
              <MetricCard label="Chi-squared" value="10,244" subtitle="Evans threshold: 4.0" signal />
            </div>

            <div className="rounded-lg border border-nex-light bg-nex-deep/30 p-4">
              <p className="mb-2 text-sm font-medium text-white">Contingency Table (2×2)</p>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div />
                <div className="text-slate-dim">Event+</div>
                <div className="text-slate-dim">Event−</div>
                <div className="text-slate-dim text-right">Drug+</div>
                <div className="font-mono text-gold">{d.contingency.a.toLocaleString()}</div>
                <div className="font-mono text-white">{d.contingency.b.toLocaleString()}</div>
                <div className="text-slate-dim text-right">Drug−</div>
                <div className="font-mono text-white">{d.contingency.c.toLocaleString()}</div>
                <div className="font-mono text-white">{d.contingency.d.toLocaleString()}</div>
              </div>
            </div>

            <WarningBox>
              All four metrics exceed their signal thresholds (PRR≥2.0, ROR-LCI&gt;1.0, IC025&gt;0,
              χ²≥4.0). This is a strong, unambiguous signal.
            </WarningBox>
          </div>
        </PipelineStep>

        {/* Step 4: Label Check */}
        <PipelineStep
          number={4}
          title="Check Drug Label"
          icon={<FileText className="h-5 w-5 text-cyan" />}
          source="DailyMed"
          latency="~1s"
        >
          <div className="flex items-center gap-4 rounded-lg border border-gold/30 bg-gold/5 p-4">
            <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-gold" />
            <div>
              <p className="font-medium text-white">On Label — Known Risk</p>
              <p className="text-sm text-slate-dim">
                {VERDICT.label.section}
              </p>
              <p className="mt-1 text-xs text-slate-dim">Source: {VERDICT.label.source}</p>
            </div>
          </div>
          <TipBox>
            Because pancreatitis is already on the label, this is a <strong>known signal</strong> —
            not a new safety concern. However, the high PRR (6.93) means it&apos;s worth monitoring
            for changes in reporting rate or severity patterns.
          </TipBox>
        </PipelineStep>

        {/* Step 5: Literature */}
        <PipelineStep
          number={5}
          title="Search Literature"
          icon={<BookOpen className="h-5 w-5 text-cyan" />}
          source="PubMed"
          latency="~2s"
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-dim">
              {VERDICT.literature.count}+ articles found on GLP-1 receptor agonist safety:
            </p>
            <ul className="space-y-2">
              {VERDICT.literature.top.map((article) => (
                <li key={article.pmid} className="flex items-start gap-2 text-sm">
                  <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan" />
                  <span className="text-slate-dim">
                    <span className="font-mono text-cyan">PMID {article.pmid}</span>
                    {' — '}
                    {article.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </PipelineStep>

        {/* Step 5.5: Conservation Law */}
        <Card className="border-copper/30 bg-nex-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-copper/10 text-sm font-bold text-copper">
                  5.5
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-copper" />
                  <CardTitle className="text-lg text-white">Conservation Law</CardTitle>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConservation(!showConservation)}
              >
                {showConservation ? 'Hide' : 'Show'} Math
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TechnicalStuffBox>
              All four disproportionality metrics are the <strong>same equation</strong> viewed through
              different mathematical lenses. They share the same input (observed vs expected rate) but
              apply different boundary functions (∂).
            </TechnicalStuffBox>

            {showConservation && (
              <div className="mt-4 rounded-lg border border-copper/20 bg-nex-deep/50 p-4 font-mono text-sm">
                <p className="text-copper">{'∃ = ∂(×(ς, ∅))'}</p>
                <p className="mt-2 text-slate-dim">
                  ς (observed) = a/(a+b) = {obs.toFixed(5)}
                </p>
                <p className="text-slate-dim">
                  ∅ (expected) = c/(c+d) = {exp.toFixed(6)}
                </p>
                <p className="mt-2 text-white">
                  PRR = ∂_ratio = {d.prr.value} — &quot;How many times more?&quot;
                </p>
                <p className="text-white">
                  ROR = ∂_odds  = {d.ror.value} — &quot;What are the odds?&quot;
                </p>
                <p className="text-white">
                  IC  = ∂_info  = {d.ic.value} — &quot;How many bits of surprise?&quot;
                </p>
                <p className="mt-2 text-gold">
                  All four agree: ↑ strong signal detected
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 6: Microgram Verdict */}
        <PipelineStep
          number={6}
          title="Microgram Verdict"
          icon={<Zap className="h-5 w-5 text-gold" />}
          source="Microgram Fleet"
          latency="52μs"
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="Causality" value={VERDICT.microgram.causality} signal />
              <MetricCard label="Naranjo Score" value={`${VERDICT.microgram.naranjo_score}/13`} />
              <MetricCard label="Action" value="Expedited Report" signal />
              <MetricCard label="Deadline" value={`${VERDICT.microgram.deadline_days} days`} subtitle="ICH E2B" />
            </div>

            <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-gold" />
                <div>
                  <p className="font-medium text-white">Regulatory Action Required</p>
                  <p className="text-sm text-slate-dim">
                    Serious case with probable causality requires 15-day expedited reporting per ICH E2B.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-dim">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Chain: {VERDICT.microgram.chain}
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                Duration: {VERDICT.microgram.chain_duration_us}μs (4 steps)
              </div>
            </div>
          </div>
        </PipelineStep>

        {/* Step 7: Provenance */}
        <PipelineStep
          number={7}
          title="Signed Provenance"
          icon={<Shield className="h-5 w-5 text-cyan" />}
          source="nv-provenance"
          latency="<1s"
        >
          <p className="text-sm text-slate-dim">
            Ed25519-signed provenance manifest records the full pipeline: timestamp, analyst,
            tool versions, output hashes, and method parameters. Satisfies 21 CFR Part 11
            audit trail requirements.
          </p>
        </PipelineStep>

        {/* Pipeline summary */}
        <Card className="border-cyan/30 bg-gradient-to-r from-cyan/5 to-gold/5">
          <CardContent className="py-6">
            <h2 className="mb-4 text-xl font-bold text-white">Pipeline Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-nex-light text-left text-slate-dim">
                    <th className="pb-2">Step</th>
                    <th className="pb-2">Source</th>
                    <th className="pb-2">Result</th>
                    <th className="pb-2">Latency</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2">1. Drug Identity</td>
                    <td>RxNav</td>
                    <td>Semaglutide, RxCUI 1991302</td>
                    <td className="text-slate-dim">~1s</td>
                  </tr>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2">2. FAERS Query</td>
                    <td>openFDA</td>
                    <td>1,468 pancreatitis cases</td>
                    <td className="text-slate-dim">~2s</td>
                  </tr>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2">3. Disproportionality</td>
                    <td>OpenVigil</td>
                    <td className="text-gold">PRR 6.93, ROR 7.09, IC 2.76</td>
                    <td className="text-slate-dim">~3s</td>
                  </tr>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2">4. Label Check</td>
                    <td>DailyMed</td>
                    <td>On Label (W&P 5.2)</td>
                    <td className="text-slate-dim">~1s</td>
                  </tr>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2">5. Literature</td>
                    <td>PubMed</td>
                    <td>5+ articles</td>
                    <td className="text-slate-dim">~2s</td>
                  </tr>
                  <tr className="border-b border-nex-light/50">
                    <td className="py-2">6. Verdict</td>
                    <td>Microgram Fleet</td>
                    <td className="text-gold">PROBABLE — expedited report</td>
                    <td className="font-mono text-cyan">52μs</td>
                  </tr>
                  <tr>
                    <td className="py-2">7. Provenance</td>
                    <td>nv-provenance</td>
                    <td>Ed25519 signed</td>
                    <td className="text-slate-dim">&lt;1s</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-wrap justify-center gap-4 py-4">
          <Link href="/nucleus/vigilance/signal-explorer">
            <Button className="gap-2 bg-cyan text-nex-deep hover:bg-cyan-glow">
              <Activity className="h-4 w-4" />
              Try Signal Explorer
            </Button>
          </Link>
          <Link href="/nucleus/academy/interactive/signal-investigation">
            <Button variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Learn Signal Detection
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
