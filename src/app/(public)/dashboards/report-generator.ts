/**
 * Report Generator — produces downloadable PV reports from dashboard workflow data.
 *
 * Generates structured HTML reports that open in a new window for printing/PDF export.
 * Also supports JSON export for programmatic use.
 *
 * Report types:
 * - Drug Safety Profile
 * - Signal Assessment Report
 * - Causality Assessment Report
 * - Benefit-Risk Assessment Report
 * - Regulatory Intelligence Brief
 * - Competitive Landscape Report
 */

import type {
  DrugIdentity,
  FaersEvent,
  DisproportionalityResult,
  LabelSection,
  PubMedArticle,
  NaranjoResult,
  WhoUmcResult,
  ClinicalTrial,
} from "./station-client";

// ─── Report Types ───────────────────────────────────────────────────────────

export interface ReportMeta {
  title: string;
  type: string;
  drug: string;
  event?: string;
  generatedAt: string;
  stationVersion: string;
  disclaimer: string;
}

export interface DrugSafetyReportData {
  meta: ReportMeta;
  drugIdentity: DrugIdentity;
  topEvents: FaersEvent[];
  outcomes?: { serious: number; deaths: number; hospitalizations: number; total: number };
  signals: DisproportionalityResult[];
  labelSections: LabelSection[];
  literature: PubMedArticle[];
  trials?: ClinicalTrial[];
}

export interface SignalReportData {
  meta: ReportMeta;
  drugIdentity: DrugIdentity;
  event: string;
  disproportionality: DisproportionalityResult;
  labelSections: LabelSection[];
  literature: PubMedArticle[];
  caseReports: PubMedArticle[];
  verdict: {
    signalDetected: boolean;
    metricsExceeded: string[];
    isLabeled: boolean;
    literatureSupport: number;
  };
}

export interface CausalityReportData {
  meta: ReportMeta;
  drug: string;
  event: string;
  naranjo?: NaranjoResult;
  whoUmc?: WhoUmcResult;
  caseReports: PubMedArticle[];
  faersContext?: { cases: number; total: number };
}

export interface BenefitRiskReportData {
  meta: ReportMeta;
  drug: string;
  benefits: { metric: string; value: string; source: string }[];
  risks: { event: string; frequency: string; seriousness: string }[];
  score?: number;
  recommendation: string;
}

// ─── Report Generation ──────────────────────────────────────────────────────

const DISCLAIMER =
  "This report is generated for educational and research purposes using publicly available data from FDA FAERS, DailyMed, PubMed, and other public databases via AlgoVigilance Station. It does not constitute medical advice, regulatory guidance, or an official pharmacovigilance assessment. All data should be independently verified before use in clinical or regulatory decision-making.";

function createMeta(type: string, title: string, drug: string, event?: string): ReportMeta {
  return {
    title,
    type,
    drug,
    event,
    generatedAt: new Date().toISOString(),
    stationVersion: "mcp.nexvigilant.com",
    disclaimer: DISCLAIMER,
  };
}

export function createDrugSafetyMeta(drug: string): ReportMeta {
  return createMeta("drug-safety-profile", `Drug Safety Profile: ${drug}`, drug);
}

export function createSignalMeta(drug: string, event: string): ReportMeta {
  return createMeta("signal-assessment", `Signal Assessment: ${drug} + ${event}`, drug, event);
}

export function createCausalityMeta(drug: string, event: string): ReportMeta {
  return createMeta("causality-assessment", `Causality Assessment: ${drug} + ${event}`, drug, event);
}

export function createBenefitRiskMeta(drug: string): ReportMeta {
  return createMeta("benefit-risk-assessment", `Benefit-Risk Assessment: ${drug}`, drug);
}

// ─── HTML Report Rendering ──────────────────────────────────────────────────

function reportStyles(): string {
  return `
    <style>
      @page { margin: 1in; size: A4; }
      @media print {
        .no-print { display: none !important; }
        body { font-size: 11pt; }
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6; color: #1a1a2e; background: #fff;
        max-width: 900px; margin: 0 auto; padding: 40px 24px;
      }
      .header {
        border-bottom: 3px solid #6366f1;
        padding-bottom: 20px; margin-bottom: 30px;
      }
      .header h1 { font-size: 24pt; color: #1a1a2e; margin-bottom: 4px; }
      .header .subtitle { color: #64748b; font-size: 11pt; }
      .brand { color: #6366f1; font-weight: 600; }
      .meta-grid {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 8px; margin: 16px 0; font-size: 10pt; color: #64748b;
      }
      .meta-grid span { padding: 6px 10px; background: #f8fafc; border-radius: 4px; }
      section { margin-bottom: 28px; }
      h2 {
        font-size: 14pt; color: #1a1a2e;
        border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 14px;
      }
      h3 { font-size: 12pt; color: #334155; margin-bottom: 8px; }
      table {
        width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt;
      }
      th, td {
        padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0;
      }
      th { background: #f1f5f9; font-weight: 600; color: #475569; }
      .signal-badge {
        display: inline-block; padding: 2px 10px; border-radius: 12px;
        font-size: 9pt; font-weight: 600;
      }
      .signal-yes { background: #fef3c7; color: #92400e; }
      .signal-no { background: #d1fae5; color: #065f46; }
      .metric-grid {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0;
      }
      .metric-card {
        padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0;
        border-radius: 8px; text-align: center;
      }
      .metric-card .label { font-size: 9pt; color: #64748b; text-transform: uppercase; }
      .metric-card .value { font-size: 20pt; font-weight: 700; color: #1a1a2e; }
      .metric-card .threshold { font-size: 8pt; color: #94a3b8; }
      .metric-card.signal { border-color: #f59e0b; background: #fffbeb; }
      .article { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
      .article .title { font-weight: 500; font-size: 10pt; }
      .article .meta { font-size: 9pt; color: #94a3b8; }
      .disclaimer {
        margin-top: 40px; padding: 16px; background: #f8fafc;
        border: 1px solid #e2e8f0; border-radius: 8px;
        font-size: 9pt; color: #64748b; line-height: 1.5;
      }
      .footer {
        margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0;
        text-align: center; font-size: 9pt; color: #94a3b8;
      }
      .actions {
        position: fixed; top: 16px; right: 16px;
        display: flex; gap: 8px; z-index: 100;
      }
      .actions button {
        padding: 8px 20px; border-radius: 8px; border: 1px solid #e2e8f0;
        background: #fff; cursor: pointer; font-size: 10pt; font-weight: 500;
      }
      .actions button.primary {
        background: #6366f1; color: white; border-color: #6366f1;
      }
      .actions button:hover { opacity: 0.85; }
      .label-text {
        background: #f8fafc; padding: 12px; border-radius: 6px;
        font-size: 10pt; color: #475569; max-height: 200px; overflow-y: auto;
        white-space: pre-wrap;
      }
      .score-badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 11pt;
      }
      .score-definite { background: #fecaca; color: #991b1b; }
      .score-probable { background: #fed7aa; color: #9a3412; }
      .score-possible { background: #fef3c7; color: #92400e; }
      .score-doubtful { background: #d1fae5; color: #065f46; }
    </style>
  `;
}

function reportHeader(meta: ReportMeta): string {
  return `
    <div class="header">
      <h1>${meta.title}</h1>
      <p class="subtitle">Generated by <span class="brand">AlgoVigilance Station</span></p>
      <div class="meta-grid">
        <span>Date: ${new Date(meta.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
        <span>Type: ${meta.type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
        <span>Source: ${meta.stationVersion}</span>
      </div>
    </div>
  `;
}

function reportFooter(meta: ReportMeta): string {
  return `
    <div class="disclaimer">
      <strong>Disclaimer:</strong> ${meta.disclaimer}
    </div>
    <div class="footer">
      AlgoVigilance &mdash; Pharmacovigilance for AlgoVigilances &mdash; nexvigilant.com<br/>
      Report ID: ${meta.type}-${Date.now().toString(36)}
    </div>
  `;
}

function actionButtons(): string {
  return `
    <div class="actions no-print">
      <button onclick="window.print()" class="primary">Download PDF</button>
      <button onclick="window.close()">Close</button>
    </div>
  `;
}

// ─── Drug Safety Profile Report ─────────────────────────────────────────────

export function generateDrugSafetyReport(data: DrugSafetyReportData): string {
  const { meta, drugIdentity, topEvents, outcomes, signals, labelSections, literature } = data;

  const eventsTable = topEvents
    .slice(0, 15)
    .map(
      (e) =>
        `<tr><td>${e.term}</td><td style="text-align:right">${e.count.toLocaleString()}</td></tr>`,
    )
    .join("");

  const signalsSection = signals
    .map((s) => {
      const badge = s.signal
        ? '<span class="signal-badge signal-yes">Signal Detected</span>'
        : '<span class="signal-badge signal-no">No Signal</span>';
      return `
        <div style="margin-bottom:16px;">
          <h3>${s.drug} + ${s.event} ${badge}</h3>
          <div class="metric-grid">
            <div class="metric-card${s.prr !== undefined && s.prr > 2 ? " signal" : ""}">
              <div class="label">PRR</div>
              <div class="value">${s.prr?.toFixed(2) ?? "—"}</div>
              <div class="threshold">Threshold: &gt;2</div>
            </div>
            <div class="metric-card${s.ror !== undefined && s.ror > 2 ? " signal" : ""}">
              <div class="label">ROR</div>
              <div class="value">${s.ror?.toFixed(2) ?? "—"}</div>
              <div class="threshold">Threshold: &gt;2</div>
            </div>
            <div class="metric-card${s.ic !== undefined && s.ic > 0 ? " signal" : ""}">
              <div class="label">IC</div>
              <div class="value">${s.ic?.toFixed(2) ?? "—"}</div>
              <div class="threshold">Threshold: &gt;0</div>
            </div>
            <div class="metric-card${s.ebgm !== undefined && s.ebgm > 2 ? " signal" : ""}">
              <div class="label">EBGM</div>
              <div class="value">${s.ebgm?.toFixed(2) ?? "—"}</div>
              <div class="threshold">Threshold: &gt;2</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  const labelContent = labelSections
    .map((s) => `<h3>${s.section}</h3><div class="label-text">${s.text.slice(0, 2000)}</div>`)
    .join("");

  const litList = literature
    .map(
      (a) =>
        `<div class="article"><div class="title">${a.title}</div><div class="meta">${a.journal ?? ""} ${a.year ? `(${a.year})` : ""} PMID: ${a.pmid}</div></div>`,
    )
    .join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${meta.title}</title>${reportStyles()}</head><body>
    ${actionButtons()}
    ${reportHeader(meta)}

    <section>
      <h2>1. Drug Identification</h2>
      <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>Drug Name</td><td><strong>${drugIdentity.name}</strong></td></tr>
        <tr><td>RxCUI</td><td>${drugIdentity.rxcui}</td></tr>
        ${drugIdentity.synonym ? `<tr><td>Also Known As</td><td>${drugIdentity.synonym}</td></tr>` : ""}
      </table>
    </section>

    <section>
      <h2>2. Adverse Event Profile (FAERS)</h2>
      ${outcomes ? `
        <div class="metric-grid" style="grid-template-columns:repeat(4,1fr);">
          <div class="metric-card"><div class="label">Total Cases</div><div class="value">${outcomes.total}</div></div>
          <div class="metric-card"><div class="label">Serious</div><div class="value">${outcomes.serious}</div></div>
          <div class="metric-card"><div class="label">Deaths</div><div class="value">${outcomes.deaths}</div></div>
          <div class="metric-card"><div class="label">Hospitalizations</div><div class="value">${outcomes.hospitalizations}</div></div>
        </div>
      ` : ""}
      <h3>Top Reported Events</h3>
      <table>
        <tr><th>Adverse Event</th><th style="text-align:right">Report Count</th></tr>
        ${eventsTable}
      </table>
    </section>

    ${signals.length > 0 ? `
    <section>
      <h2>3. Disproportionality Analysis</h2>
      <p style="font-size:10pt;color:#64748b;margin-bottom:12px;">
        Statistical signal detection using four standard pharmacovigilance metrics.
        A signal is flagged when PRR &gt; 2, ROR &gt; 2, IC &gt; 0, or EBGM &gt; 2.
      </p>
      ${signalsSection}
    </section>
    ` : ""}

    ${labelSections.length > 0 ? `
    <section>
      <h2>${signals.length > 0 ? "4" : "3"}. FDA Drug Label Review</h2>
      ${labelContent}
    </section>
    ` : ""}

    ${literature.length > 0 ? `
    <section>
      <h2>${signals.length > 0 ? "5" : "4"}. Published Literature</h2>
      ${litList}
    </section>
    ` : ""}

    ${reportFooter(meta)}
  </body></html>`;
}

// ─── Signal Assessment Report ───────────────────────────────────────────────

export function generateSignalReport(data: SignalReportData): string {
  const { meta, drugIdentity, event, disproportionality: d, labelSections, literature, caseReports, verdict } = data;

  const verdictBadge = verdict.signalDetected
    ? '<span class="signal-badge signal-yes">SIGNAL DETECTED</span>'
    : '<span class="signal-badge signal-no">NO SIGNAL</span>';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${meta.title}</title>${reportStyles()}</head><body>
    ${actionButtons()}
    ${reportHeader(meta)}

    <section>
      <h2>Executive Summary</h2>
      <p style="font-size:11pt;">
        Investigation of the association between <strong>${drugIdentity.name}</strong>
        (RxCUI: ${drugIdentity.rxcui}) and <strong>${event}</strong>.
        ${verdictBadge}
      </p>
      <table style="margin-top:12px;">
        <tr><th>Criterion</th><th>Finding</th></tr>
        <tr><td>Metrics exceeding threshold</td><td>${verdict.metricsExceeded.length > 0 ? verdict.metricsExceeded.join(", ") : "None"}</td></tr>
        <tr><td>Listed in drug label</td><td>${verdict.isLabeled ? "Yes" : "No / Unknown"}</td></tr>
        <tr><td>Literature support</td><td>${verdict.literatureSupport} publication(s)</td></tr>
      </table>
    </section>

    <section>
      <h2>Disproportionality Scores</h2>
      <div class="metric-grid">
        <div class="metric-card${d.prr !== undefined && d.prr > 2 ? " signal" : ""}">
          <div class="label">PRR</div><div class="value">${d.prr?.toFixed(2) ?? "—"}</div><div class="threshold">Threshold: &gt;2</div>
        </div>
        <div class="metric-card${d.ror !== undefined && d.ror > 2 ? " signal" : ""}">
          <div class="label">ROR</div><div class="value">${d.ror?.toFixed(2) ?? "—"}</div><div class="threshold">Threshold: &gt;2</div>
        </div>
        <div class="metric-card${d.ic !== undefined && d.ic > 0 ? " signal" : ""}">
          <div class="label">IC</div><div class="value">${d.ic?.toFixed(2) ?? "—"}</div><div class="threshold">Threshold: &gt;0</div>
        </div>
        <div class="metric-card${d.ebgm !== undefined && d.ebgm > 2 ? " signal" : ""}">
          <div class="label">EBGM</div><div class="value">${d.ebgm?.toFixed(2) ?? "—"}</div><div class="threshold">Threshold: &gt;2</div>
        </div>
      </div>
      ${d.cases ? `<p style="font-size:10pt;color:#64748b;">Based on ${d.cases.toLocaleString()} reported cases in FAERS.</p>` : ""}
    </section>

    ${labelSections.length > 0 ? `
    <section>
      <h2>Drug Label Review</h2>
      ${labelSections.map((s) => `<h3>${s.section}</h3><div class="label-text">${s.text.slice(0, 2000)}</div>`).join("")}
    </section>
    ` : ""}

    ${literature.length > 0 ? `
    <section>
      <h2>Safety Literature</h2>
      ${literature.map((a) => `<div class="article"><div class="title">${a.title}</div><div class="meta">${a.journal ?? ""} ${a.year ? `(${a.year})` : ""} PMID: ${a.pmid}</div></div>`).join("")}
    </section>
    ` : ""}

    ${caseReports.length > 0 ? `
    <section>
      <h2>Published Case Reports</h2>
      ${caseReports.map((a) => `<div class="article"><div class="title">${a.title}</div><div class="meta">${a.journal ?? ""} ${a.year ? `(${a.year})` : ""} PMID: ${a.pmid}</div></div>`).join("")}
    </section>
    ` : ""}

    ${reportFooter(meta)}
  </body></html>`;
}

// ─── Causality Assessment Report ────────────────────────────────────────────

export function generateCausalityReport(data: CausalityReportData): string {
  const { meta, drug, event, naranjo, whoUmc, caseReports } = data;

  const naranjoClass =
    naranjo && naranjo.score >= 9
      ? "score-definite"
      : naranjo && naranjo.score >= 5
        ? "score-probable"
        : naranjo && naranjo.score >= 1
          ? "score-possible"
          : "score-doubtful";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${meta.title}</title>${reportStyles()}</head><body>
    ${actionButtons()}
    ${reportHeader(meta)}

    <section>
      <h2>Assessment Summary</h2>
      <table>
        <tr><th>Drug</th><td><strong>${drug}</strong></td></tr>
        <tr><th>Adverse Event</th><td><strong>${event}</strong></td></tr>
        ${naranjo ? `<tr><th>Naranjo Score</th><td><span class="score-badge ${naranjoClass}">${naranjo.score} — ${naranjo.category}</span></td></tr>` : ""}
        ${whoUmc ? `<tr><th>WHO-UMC Category</th><td><strong>${whoUmc.category}</strong></td></tr>` : ""}
      </table>
    </section>

    ${naranjo ? `
    <section>
      <h2>Naranjo Algorithm</h2>
      <p style="font-size:10pt;color:#64748b;margin-bottom:12px;">
        Standardized 10-question algorithm for assessing adverse drug reaction causality.
        Score range: -4 to +13. Categories: Definite (>=9), Probable (5-8), Possible (1-4), Doubtful (<=0).
      </p>
      <div class="metric-grid" style="grid-template-columns:1fr 1fr;">
        <div class="metric-card">
          <div class="label">Total Score</div>
          <div class="value">${naranjo.score}</div>
        </div>
        <div class="metric-card">
          <div class="label">Category</div>
          <div class="value" style="font-size:14pt;">${naranjo.category}</div>
        </div>
      </div>
    </section>
    ` : ""}

    ${whoUmc ? `
    <section>
      <h2>WHO-UMC Assessment</h2>
      <table>
        <tr><th>Category</th><td><strong>${whoUmc.category}</strong></td></tr>
        <tr><th>Description</th><td>${whoUmc.description}</td></tr>
        ${whoUmc.criteria_met.length > 0 ? `<tr><th>Criteria Met</th><td>${whoUmc.criteria_met.join(", ")}</td></tr>` : ""}
      </table>
    </section>
    ` : ""}

    ${caseReports.length > 0 ? `
    <section>
      <h2>Supporting Case Reports</h2>
      ${caseReports.map((a) => `<div class="article"><div class="title">${a.title}</div><div class="meta">${a.journal ?? ""} ${a.year ? `(${a.year})` : ""} PMID: ${a.pmid}</div></div>`).join("")}
    </section>
    ` : ""}

    ${reportFooter(meta)}
  </body></html>`;
}

// ─── Benefit-Risk Report ────────────────────────────────────────────────────

export function generateBenefitRiskReport(data: BenefitRiskReportData): string {
  const { meta, drug, benefits, risks, score, recommendation } = data;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${meta.title}</title>${reportStyles()}</head><body>
    ${actionButtons()}
    ${reportHeader(meta)}

    <section>
      <h2>Assessment Summary</h2>
      <table>
        <tr><th>Drug</th><td><strong>${drug}</strong></td></tr>
        ${score !== undefined ? `<tr><th>QBRI Score</th><td><strong>${score.toFixed(2)}</strong></td></tr>` : ""}
        <tr><th>Recommendation</th><td>${recommendation}</td></tr>
      </table>
    </section>

    <section>
      <h2>Benefits</h2>
      <table>
        <tr><th>Metric</th><th>Value</th><th>Source</th></tr>
        ${benefits.map((b) => `<tr><td>${b.metric}</td><td>${b.value}</td><td>${b.source}</td></tr>`).join("")}
      </table>
    </section>

    <section>
      <h2>Risks</h2>
      <table>
        <tr><th>Adverse Event</th><th>Frequency</th><th>Seriousness</th></tr>
        ${risks.map((r) => `<tr><td>${r.event}</td><td>${r.frequency}</td><td>${r.seriousness}</td></tr>`).join("")}
      </table>
    </section>

    ${reportFooter(meta)}
  </body></html>`;
}

// ─── Export Utilities ────────────────────────────────────────────────────────

export function openReport(html: string): void {
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
