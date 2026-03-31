'use client';

/**
 * Cartel Analysis Panel
 *
 * Displays CIDRE algorithm metrics, detected clusters, and suspicious nodes.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Network,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { CIDREResult, CartelCluster } from '@/lib/algorithms/cidre-algorithm';

// =============================================================================
// TYPES
// =============================================================================

export interface CartelAnalysisPanelProps {
  /** CIDRE analysis results */
  cidreResult: CIDREResult;
  /** Callback when a cluster is selected */
  onClusterSelect?: (cluster: CartelCluster) => void;
  /** Callback when a node is selected */
  onNodeSelect?: (nodeId: string) => void;
  /** Show detailed node list */
  showNodeList?: boolean;
  /** Maximum nodes to display in list */
  maxNodesInList?: number;
}

type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.7) return 'critical';
  if (score >= 0.5) return 'high';
  if (score >= 0.3) return 'medium';
  if (score >= 0.1) return 'low';
  return 'safe';
}

function getRiskBadge(level: RiskLevel) {
  const config: Record<RiskLevel, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    safe: { variant: 'outline', className: 'border-emerald-500 text-emerald-500' },
    low: { variant: 'secondary', className: 'bg-cyan/20 text-cyan' },
    medium: { variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-500' },
    high: { variant: 'secondary', className: 'bg-orange-500/20 text-orange-500' },
    critical: { variant: 'destructive', className: '' },
  };
  return config[level];
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="rounded-lg border border-nex-border bg-nex-surface p-4">
      <div className="flex items-center gap-2 text-slate-light/60">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-light">{value}</span>
        {trend && (
          <TrendingUp
            className={`h-4 w-4 ${
              trend === 'up'
                ? 'text-red-400'
                : trend === 'down'
                  ? 'text-emerald-400'
                  : 'text-slate-light/40'
            }`}
          />
        )}
      </div>
      {subtext && <div className="mt-1 text-xs text-slate-light/50">{subtext}</div>}
    </div>
  );
}

function ClusterCard({
  cluster,
  index,
  onClick,
}: {
  cluster: CartelCluster;
  index: number;
  onClick?: () => void;
}) {
  const riskLevel = getRiskLevel(cluster.cidreScore);
  const badge = getRiskBadge(riskLevel);

  return (
    <div
      className="rounded-lg border border-nex-border bg-nex-deep p-4 hover:border-cyan/30 transition-colors cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{
              backgroundColor: ['#ef4444', '#f97316', '#eab308', '#a855f7', '#ec4899'][
                index % 5
              ],
            }}
          />
          <span className="font-medium text-slate-light">Cluster {index + 1}</span>
        </div>
        <Badge variant={badge.variant} className={badge.className}>
          {formatPercent(cluster.cidreScore)} CIDRE
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-slate-light/50">Members</div>
          <div className="font-medium text-slate-light">{cluster.members.length}</div>
        </div>
        <div>
          <div className="text-slate-light/50">Internal Density</div>
          <div className="font-medium text-slate-light">
            {formatPercent(cluster.internalDensity)}
          </div>
        </div>
        <div>
          <div className="text-slate-light/50">Reciprocity</div>
          <div className="font-medium text-slate-light">
            {formatPercent(cluster.reciprocityIndex)}
          </div>
        </div>
        <div>
          <div className="text-slate-light/50">External Ratio</div>
          <div className="font-medium text-slate-light">
            {formatPercent(cluster.externalRatio)}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Progress
          value={cluster.cidreScore * 100}
          className="h-1.5"
        />
      </div>

      <div className="mt-2 text-xs text-slate-light/50">
        Confidence: {formatPercent(cluster.confidence)}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CartelAnalysisPanel({
  cidreResult,
  onClusterSelect,
  onNodeSelect,
  showNodeList = true,
  maxNodesInList = 20,
}: CartelAnalysisPanelProps) {
  // Sort nodes by cartel score
  const sortedNodes = useMemo(() => {
    return Array.from(cidreResult.nodeCentrality.entries())
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score);
  }, [cidreResult.nodeCentrality]);

  const _suspiciousNodes = sortedNodes.filter((n) => n.score >= 0.5);
  const overallRisk = getRiskLevel(cidreResult.graphMetrics.avgCartelScore);
  const overallBadge = getRiskBadge(overallRisk);

  // Determine overall status
  const hasHighRisk = cidreResult.graphMetrics.avgCartelScore >= 0.5;
  const hasClusters = cidreResult.clusters.length > 0;

  return (
    <Card className="bg-nex-surface border-nex-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-slate-light flex items-center gap-2">
            <Network className="h-5 w-5 text-cyan" />
            CIDRE Analysis
          </CardTitle>
          <Badge variant={overallBadge.variant} className={overallBadge.className}>
            {overallRisk.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Banner */}
        {hasHighRisk || hasClusters ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-red-400">Suspicious Citation Pattern Detected</div>
              <div className="mt-1 text-sm text-slate-light/70">
                {hasClusters
                  ? `Found ${cidreResult.clusters.length} potential citation cartel cluster${cidreResult.clusters.length > 1 ? 's' : ''}.`
                  : 'Network exhibits high reciprocity and clustering patterns typical of citation manipulation.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-emerald-400">Normal Citation Pattern</div>
              <div className="mt-1 text-sm text-slate-light/70">
                No significant cartel indicators detected in the citation network.
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={Network}
            label="Network Size"
            value={cidreResult.metadata.nodeCount.toString()}
            subtext={`${cidreResult.metadata.edgeCount} edges`}
          />
          <MetricCard
            icon={TrendingUp}
            label="Global Reciprocity"
            value={formatPercent(cidreResult.graphMetrics.globalReciprocity)}
            subtext="Mutual citations"
            trend={cidreResult.graphMetrics.globalReciprocity > 0.3 ? 'up' : 'neutral'}
          />
          <MetricCard
            icon={Users}
            label="Clustering"
            value={formatPercent(cidreResult.graphMetrics.globalClustering)}
            subtext="Interconnectedness"
            trend={cidreResult.graphMetrics.globalClustering > 0.5 ? 'up' : 'neutral'}
          />
          <MetricCard
            icon={AlertCircle}
            label="Suspicious Nodes"
            value={cidreResult.graphMetrics.suspiciousNodeCount.toString()}
            subtext={`of ${cidreResult.metadata.nodeCount} total`}
            trend={cidreResult.graphMetrics.suspiciousNodeCount > 0 ? 'up' : 'neutral'}
          />
        </div>

        {/* Detected Clusters */}
        {cidreResult.clusters.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-light/70 uppercase tracking-wide mb-3">
              Detected Clusters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cidreResult.clusters.map((cluster, idx) => (
                <ClusterCard
                  key={idx}
                  cluster={cluster}
                  index={idx}
                  onClick={() => onClusterSelect?.(cluster)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Node Details */}
        {showNodeList && sortedNodes.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="nodes" className="border-nex-border">
              <AccordionTrigger className="text-sm text-slate-light/70 hover:text-slate-light">
                Node Cartel Scores ({sortedNodes.length} nodes)
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-lg border border-nex-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-nex-border hover:bg-transparent">
                        <TableHead className="text-slate-light/60">Node ID</TableHead>
                        <TableHead className="text-slate-light/60">CIDRE Score</TableHead>
                        <TableHead className="text-slate-light/60">Risk Level</TableHead>
                        <TableHead className="text-slate-light/60">Cluster</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedNodes.slice(0, maxNodesInList).map((node) => {
                        const riskLevel = getRiskLevel(node.score);
                        const badge = getRiskBadge(riskLevel);
                        const cluster = cidreResult.clusters.findIndex((c) =>
                          c.members.includes(node.id)
                        );

                        return (
                          <TableRow
                            key={node.id}
                            className="border-nex-border cursor-pointer hover:bg-nex-deep/50"
                            onClick={() => onNodeSelect?.(node.id)}
                          >
                            <TableCell className="font-mono text-sm text-slate-light">
                              {node.id}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={node.score * 100}
                                  className="h-1.5 w-16"
                                />
                                <span className="text-sm text-slate-light/70">
                                  {formatPercent(node.score)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={badge.variant}
                                className={`${badge.className} text-xs`}
                              >
                                {riskLevel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {cluster >= 0 ? (
                                <span className="text-sm text-orange-400">
                                  Cluster {cluster + 1}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-light/40">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {sortedNodes.length > maxNodesInList && (
                    <div className="p-2 text-center text-xs text-slate-light/50 border-t border-nex-border">
                      Showing {maxNodesInList} of {sortedNodes.length} nodes
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Analysis Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-light/40 pt-2 border-t border-nex-border">
          <span>CIDRE v{cidreResult.metadata.version}</span>
          <span>Analysis time: {cidreResult.metadata.analysisTime}ms</span>
        </div>
      </CardContent>
    </Card>
  );
}
