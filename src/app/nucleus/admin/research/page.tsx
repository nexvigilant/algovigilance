'use client';

/**
 * Citation Network Analysis Page
 *
 * Admin tool for analyzing research papers for citation cartel patterns
 * using the CIDRE algorithm with real OpenAlex data.
 */

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Search,
  Network,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Quote,
} from 'lucide-react';
import {
  analyzeCitations,
  type AnalyzeCitationsResult,
  type AnalyzeCitationsError,
} from './actions';

// Lazy load heavy visualization components
const CitationNetworkGraph = dynamic(
  () => import('@/components/research/citation-network-graph').then((m) => m.CitationNetworkGraph),
  { ssr: false, loading: () => <GraphLoadingSkeleton /> }
);

const CartelAnalysisPanel = dynamic(
  () => import('@/components/research/cartel-analysis-panel').then((m) => m.CartelAnalysisPanel),
  { ssr: false, loading: () => <PanelLoadingSkeleton /> }
);

const CitationContextPanel = dynamic(
  () => import('@/components/research/citation-context-panel').then((m) => m.CitationContextPanel),
  { ssr: false, loading: () => <PanelLoadingSkeleton /> }
);

// =============================================================================
// LOADING SKELETONS
// =============================================================================

function GraphLoadingSkeleton() {
  return (
    <div className="h-[500px] w-full rounded-lg border border-nex-border bg-nex-surface animate-pulse flex items-center justify-center">
      <div className="text-slate-light/40">Loading network graph...</div>
    </div>
  );
}

function PanelLoadingSkeleton() {
  return (
    <div className="h-[400px] w-full rounded-lg border border-nex-border bg-nex-surface animate-pulse" />
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CitationAnalysisPage() {
  // Form state
  const [workId, setWorkId] = useState('');
  const [depth, setDepth] = useState(1);
  const [maxNodes, setMaxNodes] = useState(200);
  const [threshold, setThreshold] = useState(0.5);
  const [enableS2Enrichment, setEnableS2Enrichment] = useState(false);

  // Results state
  const [result, setResult] = useState<AnalyzeCitationsResult | null>(null);
  const [error, setError] = useState<AnalyzeCitationsError | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAnalyze = () => {
    if (!workId.trim()) return;

    setError(null);
    setResult(null);

    startTransition(() => {
      analyzeCitations({
        workId: workId.trim(),
        depth,
        maxNodes,
        cidreThreshold: threshold,
        enableS2Enrichment,
      }).then((response) => {
        if (response.success) {
          setResult(response);
          setError(null);
        } else {
          setError(response);
          setResult(null);
        }
      });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPending) {
      handleAnalyze();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-headline uppercase tracking-wide text-gold">
          Citation Network Analysis
        </h1>
        <p className="mt-1 text-slate-light/60">
          Analyze research papers for citation cartel patterns using CIDRE algorithm
        </p>
      </div>

      {/* Input Form */}
      <Card className="bg-nex-surface border-nex-border">
        <CardHeader>
          <CardTitle className="text-lg text-slate-light flex items-center gap-2">
            <Search className="h-5 w-5 text-cyan" />
            Analyze Paper
          </CardTitle>
          <CardDescription>
            Enter a DOI or OpenAlex Work ID to analyze its citation network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Work ID Input */}
          <div className="space-y-2">
            <Label htmlFor="workId" className="text-slate-light">
              DOI or OpenAlex ID
            </Label>
            <div className="flex gap-2">
              <Input
                id="workId"
                placeholder="e.g., 10.1038/s41586-021-03819-2 or W2741809807"
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-nex-deep border-nex-border text-slate-light placeholder:text-slate-light/40"
                disabled={isPending}
              />
              <Button
                onClick={handleAnalyze}
                disabled={isPending || !workId.trim()}
                className="bg-cyan hover:bg-cyan-glow text-nex-deep font-medium"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Network className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-light/50">
              Examples: 10.1038/s41586-021-03819-2 (AlphaFold) | W2741809807
            </p>
          </div>

          {/* S2 Enrichment Option */}
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-nex-deep/50 border border-nex-border">
            <Checkbox
              id="enableS2"
              checked={enableS2Enrichment}
              onCheckedChange={(checked) => setEnableS2Enrichment(checked === true)}
              disabled={isPending}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label
                htmlFor="enableS2"
                className="text-slate-light cursor-pointer flex items-center gap-2"
              >
                <Quote className="h-4 w-4 text-cyan" />
                Enable Semantic Scholar Enrichment
              </Label>
              <p className="text-xs text-slate-light/50">
                Fetch citation context, intents (background/methodology/results), and influential citation markers from Semantic Scholar. This adds ~3-5 seconds to analysis time.
              </p>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Depth */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-slate-light text-sm">Network Depth</Label>
                <span className="text-sm text-cyan">{depth}</span>
              </div>
              <Slider
                value={[depth]}
                onValueChange={([v]) => setDepth(v)}
                min={1}
                max={3}
                step={1}
                disabled={isPending}
                className="py-2"
              />
              <p className="text-xs text-slate-light/50">
                Higher depth = more connections, slower analysis
              </p>
            </div>

            {/* Max Nodes */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-slate-light text-sm">Max Nodes</Label>
                <span className="text-sm text-cyan">{maxNodes}</span>
              </div>
              <Slider
                value={[maxNodes]}
                onValueChange={([v]) => setMaxNodes(v)}
                min={50}
                max={500}
                step={50}
                disabled={isPending}
                className="py-2"
              />
              <p className="text-xs text-slate-light/50">
                Limit network size for faster analysis
              </p>
            </div>

            {/* CIDRE Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-slate-light text-sm">CIDRE Threshold</Label>
                <span className="text-sm text-cyan">{threshold.toFixed(2)}</span>
              </div>
              <Slider
                value={[threshold]}
                onValueChange={([v]) => setThreshold(v)}
                min={0.1}
                max={0.9}
                step={0.05}
                disabled={isPending}
                className="py-2"
              />
              <p className="text-xs text-slate-light/50">
                Lower = more sensitive detection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400">Analysis Failed</p>
              <p className="text-sm text-slate-light/70 mt-1">{error.error}</p>
              {error.code === 'NOT_FOUND' && (
                <p className="text-xs text-slate-light/50 mt-2">
                  Try searching on{' '}
                  <a
                    href="https://openalex.org/works"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan hover:underline"
                  >
                    OpenAlex
                    <ExternalLink className="inline h-3 w-3 ml-1" />
                  </a>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Work Info */}
          <Card className="bg-nex-surface border-nex-border">
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan" />
                    <span className="text-xs font-mono text-slate-light/50 uppercase tracking-wide">
                      Analyzed Work
                    </span>
                  </div>
                  <h2 className="text-lg font-medium text-slate-light">
                    {result.work.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-slate-light/60">
                    {result.work.year && <span>{result.work.year}</span>}
                    {result.work.doi && (
                      <a
                        href={`https://doi.org/${result.work.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan hover:underline flex items-center gap-1"
                      >
                        {result.work.doi}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <span>{result.work.citedByCount.toLocaleString()} citations</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.work.isRetracted && (
                    <Badge variant="destructive">RETRACTED</Badge>
                  )}
                  <Badge
                    variant={
                      result.cidre.clusters.length > 0 ? 'destructive' : 'outline'
                    }
                    className={
                      result.cidre.clusters.length > 0
                        ? ''
                        : 'border-emerald-500 text-emerald-500'
                    }
                  >
                    {result.cidre.clusters.length > 0 ? (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {result.cidre.clusters.length} Cluster
                        {result.cidre.clusters.length > 1 ? 's' : ''} Detected
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        No Cartels Detected
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-light/60">
                  <Network className="h-4 w-4" />
                  <span>
                    {result.meta.nodeCount} nodes, {result.meta.edgeCount} edges
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-light/60">
                  <Clock className="h-4 w-4" />
                  <span>{(result.meta.analysisTimeMs / 1000).toFixed(1)}s analysis</span>
                </div>
                {result.meta.s2EnrichmentEnabled && (
                  <div className="flex items-center gap-2">
                    <Quote className="h-4 w-4 text-cyan" />
                    <span className={
                      result.meta.s2EnrichmentStatus === 'success'
                        ? 'text-emerald-400'
                        : result.meta.s2EnrichmentStatus === 'failed'
                          ? 'text-red-400'
                          : 'text-amber-400'
                    }>
                      S2: {result.meta.s2EnrichmentStatus}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visualization Tabs */}
          <Tabs defaultValue="network" className="space-y-4">
            <TabsList className="bg-nex-deep border border-nex-border">
              <TabsTrigger value="network" className="data-[state=active]:bg-cyan data-[state=active]:text-nex-deep">
                <Network className="h-4 w-4 mr-2" />
                Network Graph
              </TabsTrigger>
              <TabsTrigger value="analysis" className="data-[state=active]:bg-cyan data-[state=active]:text-nex-deep">
                <AlertTriangle className="h-4 w-4 mr-2" />
                CIDRE Analysis
              </TabsTrigger>
              {result.meta.s2EnrichmentEnabled && (
                <TabsTrigger value="context" className="data-[state=active]:bg-cyan data-[state=active]:text-nex-deep">
                  <Quote className="h-4 w-4 mr-2" />
                  Citation Context
                  {result.citationContexts && result.citationContexts.length > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs border-nex-border">
                      {result.citationContexts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="network" className="mt-4">
              <CitationNetworkGraph
                graph={{
                  nodes: new Map(result.graph.nodes.map((n) => [n.id, n])),
                  outEdges: buildOutEdgesMap(result.graph.edges),
                  inEdges: buildInEdgesMap(result.graph.edges),
                  edgeCount: result.graph.edges.length,
                }}
                cidreResult={result.cidre}
                height={600}
              />
            </TabsContent>

            <TabsContent value="analysis" className="mt-4">
              <CartelAnalysisPanel
                cidreResult={result.cidre}
                showNodeList={true}
                maxNodesInList={30}
              />
            </TabsContent>

            {result.meta.s2EnrichmentEnabled && (
              <TabsContent value="context" className="mt-4">
                <CitationContextPanel
                  contexts={result.citationContexts || []}
                  status={result.meta.s2EnrichmentStatus}
                  errorMessage={result.meta.s2EnrichmentError}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Empty State */}
      {!result && !error && !isPending && (
        <Card className="bg-nex-surface border-nex-border border-dashed">
          <CardContent className="py-12 text-center">
            <Network className="h-12 w-12 text-slate-light/20 mx-auto mb-4" />
            <p className="text-slate-light/50">
              Enter a DOI or OpenAlex ID above to analyze citation patterns
            </p>
            <p className="text-sm text-slate-light/30 mt-2">
              The CIDRE algorithm detects suspicious citation clusters that may indicate manipulation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function buildOutEdgesMap(
  edges: Array<{ source: string; target: string; weight: number; year?: number }>
): Map<string, Array<{ source: string; target: string; weight: number; year?: number }>> {
  const map = new Map<string, Array<{ source: string; target: string; weight: number; year?: number }>>();
  for (const edge of edges) {
    if (!map.has(edge.source)) {
      map.set(edge.source, []);
    }
    map.get(edge.source)?.push(edge);
  }
  return map;
}

function buildInEdgesMap(
  edges: Array<{ source: string; target: string; weight: number; year?: number }>
): Map<string, Array<{ source: string; target: string; weight: number; year?: number }>> {
  const map = new Map<string, Array<{ source: string; target: string; weight: number; year?: number }>>();
  for (const edge of edges) {
    if (!map.has(edge.target)) {
      map.set(edge.target, []);
    }
    map.get(edge.target)?.push(edge);
  }
  return map;
}
