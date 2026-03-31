'use client';

/**
 * Citation Network Graph Visualization
 *
 * Renders citation networks using force-directed graph layout.
 * Highlights cartel clusters and suspicious nodes from CIDRE analysis.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import type {
  CitationGraph,
  CIDREResult,
} from '@/lib/algorithms/cidre-algorithm';

// Dynamic import to avoid SSR issues with canvas/WebGL
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center bg-nex-surface rounded-lg">
      <div className="animate-pulse text-cyan/60">Loading graph...</div>
    </div>
  ),
});

// =============================================================================
// TYPES
// =============================================================================

export interface CitationNetworkGraphProps {
  /** Citation graph data structure */
  graph: CitationGraph;
  /** CIDRE analysis results (optional, enables cartel highlighting) */
  cidreResult?: CIDREResult;
  /** Height of the graph container */
  height?: number;
  /** Width of the graph container (defaults to 100%) */
  width?: number;
  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string) => void;
  /** Show legend */
  showLegend?: boolean;
  /** Enable zoom controls */
  showControls?: boolean;
}

interface GraphNode {
  id: string;
  name: string;
  val: number; // Node size
  color: string;
  cartelScore: number;
  inCluster: boolean;
  clusterId?: number;
  // Added by force-graph at runtime
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string;
  target: string;
  color: string;
  width: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const COLORS = {
  // Node colors based on cartel score
  safe: '#10b981', // Emerald - safe nodes
  low: '#22d3ee', // Cyan - low suspicion
  medium: '#eab308', // Yellow - medium suspicion
  high: '#f97316', // Orange - high suspicion
  critical: '#ef4444', // Red - critical (in cartel cluster)

  // Edge colors
  normalEdge: 'rgba(148, 163, 184, 0.3)', // Slate with opacity
  reciprocalEdge: '#f97316', // Orange for reciprocal edges
  clusterEdge: '#ef4444', // Red for intra-cluster edges

  // Cluster highlight colors (for different clusters)
  clusters: ['#ef4444', '#f97316', '#eab308', '#a855f7', '#ec4899'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getNodeColor(cartelScore: number, inCluster: boolean): string {
  if (inCluster) return COLORS.critical;
  if (cartelScore >= 0.7) return COLORS.high;
  if (cartelScore >= 0.5) return COLORS.medium;
  if (cartelScore >= 0.3) return COLORS.low;
  return COLORS.safe;
}

function convertGraphToForceData(
  graph: CitationGraph,
  cidreResult?: CIDREResult
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // Build cluster membership map
  const nodeClusterMap = new Map<string, number>();
  if (cidreResult?.clusters) {
    cidreResult.clusters.forEach((cluster, idx) => {
      cluster.members.forEach((member) => {
        nodeClusterMap.set(member, idx);
      });
    });
  }

  // Convert nodes
  for (const [id, node] of graph.nodes) {
    const cartelScore = cidreResult?.nodeCentrality.get(id) ?? 0;
    const clusterId = nodeClusterMap.get(id);
    const inCluster = clusterId !== undefined;

    nodes.push({
      id,
      name: node.name || id,
      val: 5 + cartelScore * 15, // Size based on suspicion level
      color: getNodeColor(cartelScore, inCluster),
      cartelScore,
      inCluster,
      clusterId,
    });
  }

  // Convert edges
  const reciprocalEdges = new Set<string>();

  // First pass: find reciprocal edges
  for (const [source, edges] of graph.outEdges) {
    for (const edge of edges) {
      const reverseKey = `${edge.target}->${source}`;
      const forwardKey = `${source}->${edge.target}`;
      if (graph.outEdges.get(edge.target)?.some((e) => e.target === source)) {
        reciprocalEdges.add(forwardKey);
        reciprocalEdges.add(reverseKey);
      }
    }
  }

  // Second pass: create links
  for (const [source, edges] of graph.outEdges) {
    for (const edge of edges) {
      const edgeKey = `${source}->${edge.target}`;
      const isReciprocal = reciprocalEdges.has(edgeKey);
      const sourceCluster = nodeClusterMap.get(source);
      const targetCluster = nodeClusterMap.get(edge.target);
      const isClusterEdge =
        sourceCluster !== undefined &&
        targetCluster !== undefined &&
        sourceCluster === targetCluster;

      links.push({
        source,
        target: edge.target,
        color: isClusterEdge
          ? COLORS.clusterEdge
          : isReciprocal
            ? COLORS.reciprocalEdge
            : COLORS.normalEdge,
        width: isClusterEdge ? 2 : isReciprocal ? 1.5 : 1,
      });
    }
  }

  return { nodes, links };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CitationNetworkGraph({
  graph,
  cidreResult,
  height = 400,
  width,
  onNodeClick,
  showLegend = true,
  showControls = true,
}: CitationNetworkGraphProps) {
  const graphRef = useRef<ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  // Convert graph data
  const graphData = useMemo(
    () => convertGraphToForceData(graph, cidreResult),
    [graph, cidreResult]
  );

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle node click
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node.id);
      onNodeClick?.(node.id);

      // Highlight connected nodes
      const connected = new Set<string>();
      connected.add(node.id);
      graphData.links.forEach((link) => {
        const linkSource = link.source;
        const linkTarget = link.target;
        const sourceId = typeof linkSource === 'string' ? linkSource
          : typeof linkSource === 'object' && linkSource !== null && 'id' in linkSource
          ? String((linkSource as GraphNode).id)
          : undefined;
        const targetId = typeof linkTarget === 'string' ? linkTarget
          : typeof linkTarget === 'object' && linkTarget !== null && 'id' in linkTarget
          ? String((linkTarget as GraphNode).id)
          : undefined;

        if (sourceId === node.id && targetId !== undefined) {
          connected.add(targetId);
        }
        if (targetId === node.id && sourceId !== undefined) {
          connected.add(sourceId);
        }
      });
      setHighlightNodes(connected);
    },
    [graphData.links, onNodeClick]
  );

  // Zoom controls
  const handleZoomIn = () => {
    graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  };

  const handleZoomOut = () => {
    graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  };

  const handleReset = () => {
    graphRef.current?.zoomToFit(400);
    setSelectedNode(null);
    setHighlightNodes(new Set());
  };

  // Node painting function
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name || node.id;
      const fontSize = 12 / globalScale;
      const isHighlighted =
        highlightNodes.size === 0 || highlightNodes.has(node.id);
      const opacity = isHighlighted ? 1 : 0.3;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, node.val, 0, 2 * Math.PI);
      ctx.fillStyle =
        opacity < 1
          ? node.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba')
          : node.color;
      ctx.fill();

      // Draw border for cluster members
      if (node.inCluster) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }

      // Draw label (only at higher zoom)
      if (globalScale > 0.8) {
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
        ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + node.val + fontSize);
      }
    },
    [highlightNodes]
  );

  // Suspicious node count
  const suspiciousCount = graphData.nodes.filter((n) => n.cartelScore >= 0.5).length;
  const clusterCount = cidreResult?.clusters.length ?? 0;

  return (
    <Card className="bg-nex-surface border-nex-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-slate-light">
            Citation Network Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {suspiciousCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {suspiciousCount} suspicious
              </Badge>
            )}
            {clusterCount > 0 && (
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                {clusterCount} cluster{clusterCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Graph Container */}
        <div
          ref={containerRef}
          className="relative rounded-lg border border-nex-border bg-nex-deep overflow-hidden"
          style={{ height }}
        >
          {/* Force graph with runtime typing - props cast to avoid generic mismatch from dynamic import */}
          {React.createElement(ForceGraph2D as React.ComponentType<Record<string, unknown>>, {
            ref: graphRef as React.MutableRefObject<ForceGraphMethods | undefined>,
            graphData,
            width: width ?? containerWidth,
            height,
            nodeCanvasObject: paintNode,
            nodePointerAreaPaint: (node: NodeObject<GraphNode>, color: string, ctx: CanvasRenderingContext2D) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc((node as GraphNode).x ?? 0, (node as GraphNode).y ?? 0, ((node as GraphNode).val ?? 5) + 5, 0, 2 * Math.PI);
              ctx.fill();
            },
            linkColor: (link: LinkObject<GraphNode, GraphLink>) => (link as GraphLink).color ?? '#94a3b8',
            linkWidth: (link: LinkObject<GraphNode, GraphLink>) => (link as GraphLink).width ?? 1,
            linkDirectionalArrowLength: 4,
            linkDirectionalArrowRelPos: 1,
            onNodeClick: (node: NodeObject<GraphNode>) => handleNodeClick(node as GraphNode),
            onNodeHover: (node: NodeObject<GraphNode> | null) => setHoverNode(node as GraphNode | null),
            cooldownTicks: 100,
            d3AlphaDecay: 0.02,
            d3VelocityDecay: 0.3,
            backgroundColor: 'transparent',
          })}

          {/* Zoom Controls */}
          {showControls && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-nex-surface/90"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-nex-surface/90"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-nex-surface/90"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Hover Tooltip */}
          {hoverNode && (
            <div className="absolute top-4 left-4 bg-nex-surface/95 border border-nex-border rounded-lg p-3 shadow-lg max-w-xs">
              <div className="text-sm font-medium text-slate-light truncate">
                {hoverNode.name || hoverNode.id}
              </div>
              <div className="mt-1 text-xs text-slate-light/60">
                Cartel Score: {(hoverNode.cartelScore * 100).toFixed(1)}%
              </div>
              {hoverNode.inCluster && (
                <div className="mt-1 text-xs text-red-400">
                  Member of suspicious cluster
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-light/60">
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.safe }}
              />
              <span>Safe (&lt;30%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.low }}
              />
              <span>Low (30-50%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.medium }}
              />
              <span>Medium (50-70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS.high }}
              />
              <span>High (&gt;70%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full border-2 border-white"
                style={{ backgroundColor: COLORS.critical }}
              />
              <span>In Cluster</span>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              <div
                className="h-0.5 w-4"
                style={{ backgroundColor: COLORS.reciprocalEdge }}
              />
              <span>Reciprocal Citation</span>
            </div>
          </div>
        )}

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-cyan" />
              <span className="text-slate-light">
                Selected: <strong>{selectedNode}</strong>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 text-xs"
                onClick={() => {
                  setSelectedNode(null);
                  setHighlightNodes(new Set());
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
