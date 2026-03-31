import { resolveReportData } from "../../lib/signal-data";
import { SignalHeader } from "../../components/signal-header";
import { ContingencyHeatmap } from "../../components/contingency-heatmap";
import { ForestPlot } from "../../components/forest-plot";
import { ConservationDiagram } from "../../components/conservation-diagram";
import { LabelStatus } from "../../components/label-status";
import { LiteraturePanel } from "../../components/literature-panel";
import { DownloadReport } from "../../components/download-report";

interface PageParams {
  drug: string;
  event: string;
}

export function generateMetadata({ params }: { params: PageParams }) {
  const drug =
    params.drug.charAt(0).toUpperCase() +
    params.drug.slice(1).replace(/-/g, " ");
  const event = params.event.replace(/-/g, " ");
  return {
    title: `${drug} + ${event} Signal Report | AlgoVigilance`,
    description: `Pharmacovigilance signal detection report for ${drug} and ${event}. PRR, ROR, IC, EBGM, Evans criteria, label status, and literature summary.`,
  };
}

export default async function SignalReportPage({ params }: { params: PageParams }) {
  const data = await resolveReportData(params.drug, params.event);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Section 1: Header with verdict */}
      <SignalHeader data={data} />

      {/* Section 2 + 3: Contingency table and forest plot side-by-side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContingencyHeatmap
          values={data.contingency}
          observedRate={data.observed_rate}
          expectedRate={data.expected_rate}
        />
        <ForestPlot scores={data.scores} />
      </div>

      {/* Section 4: Conservation law diagram */}
      <ConservationDiagram
        scores={data.scores}
        observedRate={data.observed_rate}
        expectedRate={data.expected_rate}
      />

      {/* Section 5 + 6: Label status and literature side-by-side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LabelStatus
          onLabel={data.on_label}
          labelSections={data.label_sections}
          labelQuote={data.label_quote}
          drug={data.drug}
          event={data.event}
        />
        <LiteraturePanel
          count={data.literature_count}
          articles={data.top_articles}
          drug={data.drug}
          event={data.event}
        />
      </div>

      {/* Footer: report metadata */}
      <div className="border border-white/[0.06] bg-white/[0.01] px-4 py-3 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="intel-status-active" />
          <span className="intel-label">
            AlgoVigilance Signal Report / FAERS Disproportionality Analysis
          </span>
        </div>
        <div className="flex gap-4 text-[9px] font-mono text-slate-dim/30 tabular-nums">
          <span>RxCUI: {data.rxcui}</span>
          <span>|</span>
          <span>Analysis: {data.date_of_analysis}</span>
          <span>|</span>
          <span>Computation: pv-compute (client-side)</span>
        </div>
      </div>

      {/* Download official reports */}
      <DownloadReport drug={data.drug} event={data.event} />

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Signal report computed via pv-compute. AI agents generate identical reports at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
