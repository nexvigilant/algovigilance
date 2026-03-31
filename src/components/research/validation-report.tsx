'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Lazy load heavy graph components
const CitationNetworkGraph = dynamic(
  () => import('./citation-network-graph').then((mod) => ({ default: mod.CitationNetworkGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-nex-surface rounded-lg flex items-center justify-center">
        <span className="text-cyan/60 animate-pulse">Loading network graph...</span>
      </div>
    ),
  }
);

const CartelAnalysisPanel = dynamic(
  () => import('./cartel-analysis-panel').then((mod) => ({ default: mod.CartelAnalysisPanel })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] bg-nex-surface rounded-lg flex items-center justify-center">
        <span className="text-cyan/60 animate-pulse">Loading analysis...</span>
      </div>
    ),
  }
);
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Microscope,
  FileCheck,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  Brain,
  Beaker,
  Users,
  Atom,
  AlertOctagon,
  Zap,
  Database,
  GitBranch,
  BookOpen,
  Network,
} from 'lucide-react';
import type { ValidationResult, ValidationFlag } from '@/lib/algorithms/research-validator';
import type { ValidationResultV2 } from '@/lib/algorithms/research-validator-v2';
import type { ResearchDomain, DomainQualityIndicators, KillSwitchResult, StatisticalEvidence } from '@/lib/algorithms/cmer-v2-extensions';
import type { CitationGraph, CIDREResult } from '@/lib/algorithms/cidre-algorithm';

// =============================================================================
// TYPES
// =============================================================================

interface ValidationReportProps {
  result: ValidationResult | ValidationResultV2;
  title?: string;
  sourceUrl?: string;
  className?: string;
  compact?: boolean;
  /** Citation graph for network visualization (optional) */
  citationGraph?: CitationGraph;
  /** CIDRE analysis result for cartel detection (optional) */
  cidreResult?: CIDREResult;
}

interface DimensionBarProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  colorClass: string;
}

interface FlagItemProps {
  flag: ValidationFlag;
}

// Type guard to check if result is v2.0
function isV2Result(result: ValidationResult | ValidationResultV2): result is ValidationResultV2 {
  return 'version' in result && result.version === '2.0';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'text-emerald-400';
    case 'B':
      return 'text-cyan';
    case 'C':
      return 'text-amber-400';
    case 'D':
      return 'text-orange-400';
    case 'F':
      return 'text-red-400';
    default:
      return 'text-slate-400';
  }
}

function getGradeBgColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'bg-emerald-500/20 border-emerald-500/30';
    case 'B':
      return 'bg-cyan/20 border-cyan/30';
    case 'C':
      return 'bg-amber-500/20 border-amber-500/30';
    case 'D':
      return 'bg-orange-500/20 border-orange-500/30';
    case 'F':
      return 'bg-red-500/20 border-red-500/30';
    default:
      return 'bg-slate-500/20 border-slate-500/30';
  }
}

function getScoreBarColor(score: number): string {
  if (score >= 0.8) return 'bg-emerald-500';
  if (score >= 0.6) return 'bg-cyan';
  if (score >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}

function getSeverityIcon(severity: ValidationFlag['severity']) {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-400" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case 'info':
      return <Info className="h-4 w-4 text-cyan/70" />;
  }
}

function getSeverityBgColor(severity: ValidationFlag['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/20';
    case 'warning':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'info':
      return 'bg-cyan/10 border-cyan/20';
  }
}

function getDomainIcon(domain: ResearchDomain) {
  switch (domain) {
    case 'cs_ml':
      return <Brain className="h-4 w-4" />;
    case 'medicine':
      return <Beaker className="h-4 w-4" />;
    case 'social_science':
      return <Users className="h-4 w-4" />;
    case 'physics':
      return <Atom className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
}

function getDomainLabel(domain: ResearchDomain): string {
  switch (domain) {
    case 'cs_ml':
      return 'Computer Science / ML';
    case 'medicine':
      return 'Medicine / Clinical';
    case 'social_science':
      return 'Social Science';
    case 'physics':
      return 'Physics / Engineering';
    default:
      return 'General';
  }
}

function getDomainColor(domain: ResearchDomain): string {
  switch (domain) {
    case 'cs_ml':
      return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'medicine':
      return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    case 'social_science':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'physics':
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    default:
      return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  }
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function DimensionBar({ label, score, icon, colorClass }: DimensionBarProps) {
  const percentage = Math.round(score * 100);
  const blocks = Math.round(score * 5);

  return (
    <div className="flex items-center gap-3">
      <div className={cn('p-2 rounded-lg bg-nex-surface', colorClass)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-light">{label}</span>
          <span className="text-sm font-mono text-slate-light/70">{percentage}%</span>
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-sm transition-colors',
                i < blocks ? getScoreBarColor(score) : 'bg-nex-surface'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function V2ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const percentage = Math.round(score * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded bg-nex-surface text-cyan/70">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-slate-light/70">{label}</span>
          <span className="text-xs font-mono text-cyan/70">{percentage}%</span>
        </div>
        <div className="h-1.5 bg-nex-surface rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all', getScoreBarColor(score))}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function FlagItem({ flag }: FlagItemProps) {
  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border', getSeverityBgColor(flag.severity))}>
      <div className="mt-0.5">{getSeverityIcon(flag.severity)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-wide text-slate-light/50">{flag.code}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-nex-surface text-slate-light/70">{flag.dimension}</span>
        </div>
        <p className="text-sm text-slate-light">{flag.message}</p>
      </div>
    </div>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  let label = 'High';
  let color = 'text-emerald-400';

  if (confidence < 0.5) {
    label = 'Low';
    color = 'text-red-400';
  } else if (confidence < 0.75) {
    label = 'Medium';
    color = 'text-amber-400';
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono uppercase tracking-wide text-slate-light/50">Confidence</span>
      <span className={cn('text-sm font-medium', color)}>
        {label} ({percentage}%)
      </span>
    </div>
  );
}

function DomainBadge({ domain, confidence }: { domain: ResearchDomain; confidence: number }) {
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border', getDomainColor(domain))}>
      {getDomainIcon(domain)}
      <span className="text-sm font-medium">{getDomainLabel(domain)}</span>
      <span className="text-xs opacity-60">({Math.round(confidence * 100)}%)</span>
    </div>
  );
}

function KillSwitchAlert({ killSwitch }: { killSwitch: KillSwitchResult }) {
  if (!killSwitch.triggered) return null;

  const isFatal = killSwitch.severity === 'fatal';

  return (
    <div className={cn(
      'p-4 rounded-lg border flex items-start gap-3',
      isFatal ? 'bg-red-500/20 border-red-500/30' : 'bg-amber-500/20 border-amber-500/30'
    )}>
      <AlertOctagon className={cn('h-5 w-5 shrink-0', isFatal ? 'text-red-400' : 'text-amber-400')} />
      <div>
        <h4 className={cn('text-sm font-semibold', isFatal ? 'text-red-400' : 'text-amber-400')}>
          {isFatal ? 'FATAL: Validation Failed' : 'CRITICAL: Score Reduced'}
        </h4>
        <p className="text-sm text-slate-light/80 mt-1">{killSwitch.reason}</p>
      </div>
    </div>
  );
}

function DomainIndicatorsPanel({ domain, indicators }: { domain: ResearchDomain; indicators: DomainQualityIndicators }) {
  const renderIndicator = (label: string, value: boolean | number | undefined, icon: React.ReactNode) => {
    if (value === undefined) return null;
    const isBoolean = typeof value === 'boolean';
    const isPassing = isBoolean ? value : value >= 0.6;

    return (
      <div className="flex items-center gap-2">
        <div className={cn('p-1 rounded', isPassing ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
          {icon}
        </div>
        <span className="text-xs text-slate-light/70">{label}</span>
        {isBoolean ? (
          isPassing ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-red-400" />
          )
        ) : (
          <span className={cn('text-xs font-mono', isPassing ? 'text-emerald-400' : 'text-amber-400')}>
            {typeof value === 'number' ? value.toFixed(2) : value}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 rounded-lg border border-nex-border bg-nex-deep/30">
      <h4 className="text-xs font-mono uppercase tracking-widest text-slate-light/50 mb-3 flex items-center gap-2">
        {getDomainIcon(domain)}
        Domain Quality Indicators
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {domain === 'cs_ml' && (
          <>
            {renderIndicator('Ablation Study', indicators.hasAblationStudy, <GitBranch className="h-3 w-3 text-purple-400" />)}
            {renderIndicator('Code Available', indicators.hasCodeAvailable, <Database className="h-3 w-3 text-purple-400" />)}
            {renderIndicator('Benchmarks', indicators.hasBenchmarkComparison, <TrendingUp className="h-3 w-3 text-purple-400" />)}
          </>
        )}
        {domain === 'social_science' && (
          <>
            {renderIndicator('ICR Reported', !!indicators.interCoderReliability, <Users className="h-3 w-3 text-blue-400" />)}
            {indicators.interCoderReliability !== undefined && (
              renderIndicator('ICR Value', indicators.interCoderReliability, <CheckCircle2 className="h-3 w-3 text-blue-400" />)
            )}
            {renderIndicator('Saturation', indicators.hasSaturationStatement, <FileCheck className="h-3 w-3 text-blue-400" />)}
          </>
        )}
        {domain === 'physics' && (
          <>
            {renderIndicator('Error Bars', indicators.hasErrorBars, <AlertTriangle className="h-3 w-3 text-amber-400" />)}
            {renderIndicator('Error Propagation', indicators.hasErrorPropagation, <TrendingUp className="h-3 w-3 text-amber-400" />)}
            {renderIndicator('V&V Standards', indicators.meetsVVStandards, <Shield className="h-3 w-3 text-amber-400" />)}
          </>
        )}
        {domain === 'medicine' && (
          <>
            {renderIndicator('Pre-registered', indicators.isPreregistered, <FileCheck className="h-3 w-3 text-emerald-400" />)}
            {renderIndicator('STROBE/CONSORT', indicators.meetsSTROBE, <CheckCircle2 className="h-3 w-3 text-emerald-400" />)}
            {renderIndicator('Carlisle Check', indicators.passesCarilsleCheck, <Shield className="h-3 w-3 text-emerald-400" />)}
          </>
        )}
      </div>
    </div>
  );
}

function StatisticalEvidenceTable({ evidence }: { evidence: StatisticalEvidence[] }) {
  if (evidence.length === 0) return null;

  return (
    <div className="p-4 rounded-lg border border-nex-border bg-nex-deep/30">
      <h4 className="text-xs font-mono uppercase tracking-widest text-slate-light/50 mb-3 flex items-center gap-2">
        <Zap className="h-3 w-3" />
        Extracted Statistical Evidence
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-nex-border">
              <th className="text-left py-2 text-slate-light/50 font-mono">Type</th>
              <th className="text-right py-2 text-slate-light/50 font-mono">Value</th>
              <th className="text-right py-2 text-slate-light/50 font-mono">S-Value</th>
              <th className="text-center py-2 text-slate-light/50 font-mono">Strength</th>
            </tr>
          </thead>
          <tbody>
            {evidence.slice(0, 5).map((ev, i) => {
              const strength = ev.sValue >= 10 ? 'Strong' : ev.sValue >= 7 ? 'Moderate' : ev.sValue >= 4.3 ? 'Suggestive' : 'Weak';
              const strengthColor = ev.sValue >= 10 ? 'text-emerald-400' : ev.sValue >= 7 ? 'text-cyan' : ev.sValue >= 4.3 ? 'text-amber-400' : 'text-red-400';

              return (
                <tr key={i} className="border-b border-nex-border/50">
                  <td className="py-2 text-slate-light">{ev.effectSizeType || 'p-value'}</td>
                  <td className="py-2 text-right font-mono text-slate-light/70">{ev.pValue.toPrecision(3)}</td>
                  <td className="py-2 text-right font-mono text-cyan">{ev.sValue.toFixed(1)} bits</td>
                  <td className={cn('py-2 text-center', strengthColor)}>{strength}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {evidence.length > 5 && (
          <p className="text-xs text-slate-light/50 mt-2">+ {evidence.length - 5} more evidence items</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ValidationReport({
  result,
  title,
  sourceUrl,
  className,
  compact = false,
  citationGraph,
  cidreResult,
}: ValidationReportProps) {
  const [showAllFlags, setShowAllFlags] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNetwork, setShowNetwork] = useState(false);

  const isV2 = isV2Result(result);
  const criticalFlags = result.flags.filter((f) => f.severity === 'critical');
  const warningFlags = result.flags.filter((f) => f.severity === 'warning');
  const infoFlags = result.flags.filter((f) => f.severity === 'info');

  const displayedFlags = showAllFlags ? result.flags : result.flags.slice(0, 5);

  return (
    <div className={cn('rounded-xl border border-nex-border bg-nex-surface/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-nex-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-mono uppercase tracking-widest text-cyan/60">Research Validation</p>
              {isV2 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  v2.0
                </span>
              )}
            </div>
            {title && <h3 className="text-lg font-semibold text-slate-light truncate">{title}</h3>}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-cyan/70 hover:text-cyan mt-1"
              >
                View Source <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {/* Domain Badge for v2 */}
            {isV2 && (
              <div className="mt-3">
                <DomainBadge domain={result.domain} confidence={result.domainConfidence} />
              </div>
            )}
          </div>

          {/* Grade Badge */}
          <div
            className={cn(
              'flex flex-col items-center justify-center p-4 rounded-xl border-2',
              getGradeBgColor(result.grade)
            )}
          >
            <span className={cn('text-4xl font-bold', getGradeColor(result.grade))}>{result.grade}</span>
            <span className="text-sm font-mono text-slate-light/70">{Math.round(result.overallScore * 100)}%</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="mt-4">
          <ConfidenceIndicator confidence={result.confidence} />
        </div>
      </div>

      {/* Kill Switch Alert for v2 */}
      {isV2 && result.killSwitch.triggered && (
        <div className="p-4 sm:p-6 border-b border-nex-border">
          <KillSwitchAlert killSwitch={result.killSwitch} />
        </div>
      )}

      {/* Dimension Scores */}
      <div className="p-4 sm:p-6 border-b border-nex-border">
        <h4 className="text-xs font-mono uppercase tracking-widest text-slate-light/50 mb-4">Dimension Analysis</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <DimensionBar
            label="Credibility"
            score={result.dimensionScores.credibility}
            icon={<Shield className="h-4 w-4 text-cyan" />}
            colorClass="text-cyan"
          />
          <DimensionBar
            label="Methodology"
            score={result.dimensionScores.methodology}
            icon={<Microscope className="h-4 w-4 text-purple-400" />}
            colorClass="text-purple-400"
          />
          <DimensionBar
            label="Evidence"
            score={result.dimensionScores.evidence}
            icon={<FileCheck className="h-4 w-4 text-emerald-400" />}
            colorClass="text-emerald-400"
          />
          <DimensionBar
            label="Reproducibility"
            score={result.dimensionScores.reproducibility}
            icon={<RefreshCw className="h-4 w-4 text-amber-400" />}
            colorClass="text-amber-400"
          />
        </div>
      </div>

      {/* V2.0 Enhanced Scores */}
      {isV2 && !compact && (
        <div className="p-4 sm:p-6 border-b border-nex-border">
          <h4 className="text-xs font-mono uppercase tracking-widest text-slate-light/50 mb-4 flex items-center gap-2">
            <Zap className="h-3 w-3 text-purple-400" />
            Enhanced v2.0 Metrics
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <V2ScoreBar
              label="S-Value Evidence"
              score={result.v2Scores.sValueScore}
              icon={<TrendingUp className="h-3 w-3" />}
            />
            <V2ScoreBar
              label="Domain Quality"
              score={result.v2Scores.domainSpecificScore}
              icon={getDomainIcon(result.domain)}
            />
            <V2ScoreBar
              label="Credibility 2.0"
              score={result.v2Scores.credibility2}
              icon={<Shield className="h-3 w-3" />}
            />
            <V2ScoreBar
              label="FAIR Compliance"
              score={result.v2Scores.fairScore}
              icon={<Database className="h-3 w-3" />}
            />
          </div>
        </div>
      )}

      {/* Flags */}
      {result.flags.length > 0 && (
        <div className="p-4 sm:p-6 border-b border-nex-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-light/50">Issues Identified</h4>
            <div className="flex items-center gap-2 text-xs">
              {criticalFlags.length > 0 && (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="h-3 w-3" />
                  {criticalFlags.length}
                </span>
              )}
              {warningFlags.length > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {warningFlags.length}
                </span>
              )}
              {infoFlags.length > 0 && (
                <span className="flex items-center gap-1 text-cyan/70">
                  <Info className="h-3 w-3" />
                  {infoFlags.length}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {displayedFlags.map((flag, index) => (
              <FlagItem key={`${flag.code}-${index}`} flag={flag} />
            ))}
          </div>

          {result.flags.length > 5 && (
            <button
              onClick={() => setShowAllFlags(!showAllFlags)}
              className="flex items-center gap-1 mt-3 text-sm text-cyan/70 hover:text-cyan transition-colors"
            >
              {showAllFlags ? (
                <>
                  Show Less <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show All ({result.flags.length}) <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && !compact && (
        <div className="p-4 sm:p-6 border-b border-nex-border">
          <h4 className="text-xs font-mono uppercase tracking-widest text-slate-light/50 mb-4">Recommendations</h4>
          <div className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 text-sm text-slate-light">
                <TrendingUp className="h-4 w-4 text-cyan/70 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced V2 Details (Collapsible) */}
      {isV2 && !compact && (
        <div className="border-b border-nex-border">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 sm:p-6 flex items-center justify-between text-sm text-slate-light/70 hover:text-slate-light transition-colors"
          >
            <span className="text-xs font-mono uppercase tracking-widest">Advanced Details</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showAdvanced && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              <DomainIndicatorsPanel domain={result.domain} indicators={result.domainIndicators} />
              {result.statisticalEvidence.length > 0 && (
                <StatisticalEvidenceTable evidence={result.statisticalEvidence} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Citation Network Analysis (when CIDRE data available) */}
      {(citationGraph || cidreResult) && !compact && (
        <div className="border-b border-nex-border">
          <button
            onClick={() => setShowNetwork(!showNetwork)}
            className="w-full p-4 sm:p-6 flex items-center justify-between text-sm text-slate-light/70 hover:text-slate-light transition-colors"
          >
            <span className="text-xs font-mono uppercase tracking-widest flex items-center gap-2">
              <Network className="h-3 w-3 text-cyan" />
              Citation Network Analysis
              {cidreResult && cidreResult.clusters.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  {cidreResult.clusters.length} cluster{cidreResult.clusters.length > 1 ? 's' : ''} detected
                </span>
              )}
            </span>
            {showNetwork ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showNetwork && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              {citationGraph && (
                <CitationNetworkGraph
                  graph={citationGraph}
                  cidreResult={cidreResult}
                  height={400}
                  showLegend
                  showControls
                />
              )}
              {cidreResult && <CartelAnalysisPanel cidreResult={cidreResult} />}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="p-4 sm:p-6 bg-nex-deep/50">
        <p className="text-sm text-slate-light/80">{result.summary}</p>
      </div>
    </div>
  );
}

// =============================================================================
// COMPACT VARIANT
// =============================================================================

export function ValidationBadge({
  result,
  className,
}: {
  result: Pick<ValidationResult, 'grade' | 'overallScore' | 'confidence'> & { version?: '2.0'; domain?: ResearchDomain };
  className?: string;
}) {
  const isV2 = 'version' in result && result.version === '2.0';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border',
        getGradeBgColor(result.grade),
        className
      )}
    >
      <span className={cn('text-lg font-bold', getGradeColor(result.grade))}>{result.grade}</span>
      <span className="text-xs font-mono text-slate-light/70">{Math.round(result.overallScore * 100)}%</span>
      {isV2 && result.domain && (
        <span className="text-xs text-slate-light/50">{getDomainIcon(result.domain)}</span>
      )}
      {result.confidence < 0.75 && (
        <span className="text-xs text-amber-400" title="Lower confidence">
          *
        </span>
      )}
    </div>
  );
}

// =============================================================================
// LOADING STATE
// =============================================================================

export function ValidationReportSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-nex-border bg-nex-surface/50 overflow-hidden animate-pulse', className)}>
      <div className="p-6 border-b border-nex-border">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-nex-surface rounded" />
            <div className="h-5 w-48 bg-nex-surface rounded" />
            <div className="h-6 w-32 bg-nex-surface rounded mt-2" />
          </div>
          <div className="h-20 w-20 bg-nex-surface rounded-xl" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 bg-nex-surface rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-nex-surface rounded" />
              <div className="h-2 w-full bg-nex-surface rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// COMPARISON VIEW
// =============================================================================

export function ValidationComparison({
  v1Result,
  v2Result,
  className,
}: {
  v1Result?: ValidationResult;
  v2Result?: ValidationResultV2;
  className?: string;
}) {
  if (!v1Result && !v2Result) return null;

  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {v1Result && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-light/50">CMER v1.0</h3>
          <ValidationReport result={v1Result} compact />
        </div>
      )}
      {v2Result && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-widest text-purple-400">CMER v2.0</h3>
          <ValidationReport result={v2Result} compact />
        </div>
      )}
    </div>
  );
}
