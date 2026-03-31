'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { logger } from '@/lib/logger';
const log = logger.scope('components/pathway-dag');
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  GitBranch,
  CheckCircle2,
  Lock,
  Circle,
} from 'lucide-react';
import type {
  PathwayDAG as PathwayDAGType,
  DAGNode,
  DAGRenderOptions,
  DEFAULT_NODE_STYLES,
} from '@/types/pathway-dag';

// vis-network types (will be imported dynamically)
type Network = {
  fit: () => void;
  focus: (nodeId: string, options?: Record<string, unknown>) => void;
  selectNodes: (nodeIds: string[]) => void;
  getScale: () => number;
  moveTo: (options: { scale: number }) => void;
  destroy: () => void;
  on: (event: string, callback: (params: { nodes: string[] }) => void) => void;
};

interface PathwayDAGProps {
  dag: PathwayDAGType;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  selectedNodeId?: string;
  options?: Partial<DAGRenderOptions>;
  className?: string;
}

const defaultOptions: DAGRenderOptions = {
  direction: 'UD',
  physics: false,
  nodeSpacing: 150,
  levelSeparation: 100,
  highlightPath: true,
};

// Node styles matching brand colors
const nodeStyles: typeof DEFAULT_NODE_STYLES = {
  locked: {
    color: '#1e293b',
    borderColor: '#334155',
    opacity: 0.5,
  },
  available: {
    color: '#0e7490',
    borderColor: '#06b6d4',
    opacity: 1,
  },
  in_progress: {
    color: '#ca8a04',
    borderColor: '#eab308',
    opacity: 1,
  },
  completed: {
    color: '#059669',
    borderColor: '#10b981',
    opacity: 1,
  },
};

/**
 * PathwayDAG Component
 * Interactive DAG visualization for capability pathways using vis-network
 */
export function PathwayDAG({
  dag,
  onNodeClick,
  onNodeHover,
  selectedNodeId,
  options: userOptions,
  className,
}: PathwayDAGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<DAGNode | null>(null);
  const fitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize options to prevent unnecessary effect re-runs
  const options = useMemo(
    () => ({ ...defaultOptions, ...userOptions }),
    [userOptions]
  );

  // Convert DAG to vis-network format
  const convertToVisData = useCallback(() => {
    const nodes = dag.nodes.map((node) => {
      const style = nodeStyles[node.status];
      const isSelected = node.id === selectedNodeId;

      return {
        id: node.id,
        label: node.label,
        title: `${node.label}\n${node.status}`,
        color: {
          background: style.color,
          border: isSelected ? '#fbbf24' : style.borderColor,
          highlight: {
            background: style.color,
            border: '#fbbf24',
          },
        },
        opacity: style.opacity,
        borderWidth: isSelected ? 3 : 2,
        shape: node.type === 'checkpoint' ? 'diamond' : 'box',
        font: {
          color: '#f1f5f9',
          size: 12,
        },
        level: node.level ? parseInt(node.level.replace('L', '').replace('+', '6')) : undefined,
      };
    });

    const edges = dag.edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      arrows: 'to',
      color: {
        color: edge.type === 'prerequisite' ? '#64748b' : '#475569',
        opacity: 0.6,
      },
      dashes: edge.type === 'recommended',
      width: edge.type === 'prerequisite' ? 2 : 1,
    }));

    return { nodes, edges };
  }, [dag, selectedNodeId]);

  // Initialize vis-network
  useEffect(() => {
    if (!containerRef.current) return;

    const initNetwork = async () => {
      setIsLoading(true);

      try {
        // Dynamic import for vis-network
        const vis = await import('vis-network/standalone');
        const { nodes, edges } = convertToVisData();

        const data = {
          nodes: new vis.DataSet(nodes),
          edges: new vis.DataSet(edges),
        };

        const networkOptions = {
          layout: {
            hierarchical: {
              enabled: true,
              direction: options.direction,
              sortMethod: 'directed',
              levelSeparation: options.levelSeparation,
              nodeSpacing: options.nodeSpacing,
            },
          },
          physics: {
            enabled: options.physics,
            hierarchicalRepulsion: {
              nodeDistance: options.nodeSpacing,
            },
          },
          interaction: {
            hover: true,
            selectConnectedEdges: true,
            tooltipDelay: 200,
          },
          nodes: {
            margin: { top: 10, bottom: 10, left: 10, right: 10 },
            widthConstraint: { minimum: 100, maximum: 150 },
          },
          edges: {
            smooth: {
              enabled: true,
              type: 'cubicBezier',
              forceDirection: options.direction === 'UD' || options.direction === 'DU' ? 'vertical' : 'horizontal',
              roundness: 0.5,
            },
          },
        };

        if (!containerRef.current) return;
        const network = new vis.Network(containerRef.current, data, networkOptions);
        networkRef.current = network as unknown as Network;

        // Event handlers
        network.on('click', (params: { nodes: string[] }) => {
          if (params.nodes.length > 0 && onNodeClick) {
            onNodeClick(params.nodes[0]);
          }
        });

        network.on('hoverNode', (params: { node: string }) => {
          const node = dag.nodes.find((n) => n.id === params.node);
          setHoveredNode(node || null);
          onNodeHover?.(params.node);
        });

        network.on('blurNode', () => {
          setHoveredNode(null);
          onNodeHover?.(null);
        });

        // Fit after stabilization
        network.once('stabilizationIterationsDone', () => {
          network.fit();
          setIsLoading(false);
        });

        // If no physics, fit immediately (with cleanup tracking)
        if (!options.physics) {
          fitTimeoutRef.current = setTimeout(() => {
            network.fit();
            setIsLoading(false);
          }, 100);
        }
      } catch (error) {
        log.error('Failed to initialize vis-network:', error);
        setIsLoading(false);
      }
    };

    initNetwork();

    return () => {
      // Clear fit timeout to prevent setState on unmounted component
      if (fitTimeoutRef.current) {
        clearTimeout(fitTimeoutRef.current);
        fitTimeoutRef.current = null;
      }
      networkRef.current?.destroy();
    };
  }, [dag, options, convertToVisData, onNodeClick, onNodeHover]);

  // Zoom controls
  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.2 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 0.8 });
    }
  };

  const handleFit = () => {
    networkRef.current?.fit();
  };

  const handleFocusNode = (nodeId: string) => {
    networkRef.current?.focus(nodeId, {
      scale: 1.5,
      animation: { duration: 500, easingFunction: 'easeInOutQuad' },
    });
    networkRef.current?.selectNodes([nodeId]);
  };

  // Get status icon
  const getStatusIcon = (status: DAGNode['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-gold fill-gold/20" />;
      case 'available':
        return <Circle className="h-4 w-4 text-cyan" />;
      case 'locked':
        return <Lock className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            Capability Pathway
          </CardTitle>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleFit}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => selectedNodeId && handleFocusNode(selectedNodeId)}
                    disabled={!selectedNodeId}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Focus Selected</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            {getStatusIcon('completed')}
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon('in_progress')}
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon('available')}
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon('locked')}
            <span>Locked</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Network Container */}
        <div
          ref={containerRef}
          className="h-[400px] w-full bg-nex-deep rounded-b-lg"
          style={{ minHeight: 400 }}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-nex-deep/80 rounded-b-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GitBranch className="h-5 w-5 animate-pulse" />
              Loading pathway...
            </div>
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 p-3 bg-nex-surface border border-nex-border rounded-lg shadow-lg max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(hoveredNode.status)}
              <span className="font-medium text-sm">{hoveredNode.label}</span>
            </div>
            {hoveredNode.level && (
              <Badge variant="outline" className="text-xs mr-2">
                {hoveredNode.level}
              </Badge>
            )}
            {hoveredNode.metadata?.type && (
              <Badge variant="outline" className="text-xs capitalize">
                {hoveredNode.metadata.type}
              </Badge>
            )}
            {hoveredNode.metadata?.estimatedMinutes && (
              <p className="text-xs text-muted-foreground mt-1">
                ~{hoveredNode.metadata.estimatedMinutes} min
              </p>
            )}
          </div>
        )}

        {/* Stats bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-nex-border text-xs text-muted-foreground">
          <span>
            {dag.metadata.completedNodes}/{dag.metadata.totalNodes} completed
          </span>
          <span>Current: {dag.metadata.currentLevel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default PathwayDAG;
