"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  GitBranch,
  FlaskConical,
  Download,
  Copy,
  TreeDeciduous,
} from "lucide-react";
import type { TreeNode, MicrogramDetail } from "../types";
import { domainColor } from "../data";

// ---------------------------------------------------------------------------
// Tree Visualization — recursive node rendering
// ---------------------------------------------------------------------------

function TreeVisualization({
  nodes,
  startId,
}: {
  nodes: TreeNode[];
  startId: string;
}) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function renderNode(
    id: string,
    depth: number,
    visited: Set<string>,
  ): React.ReactNode {
    if (visited.has(id)) return null;
    visited.add(id);

    const node = nodeMap.get(id);
    if (!node) return null;

    const indent = depth * 24;
    const isCondition = node.type === "condition";

    return (
      <div key={id}>
        <div
          className="flex items-start gap-2 py-1 px-2 rounded hover:bg-nex-surface/30 transition-colors"
          style={{ marginLeft: indent }}
        >
          {isCondition ? (
            <GitBranch className="h-3.5 w-3.5 text-cyan/60 mt-0.5 flex-shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 mt-0.5 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <span className="text-xs font-mono text-slate-light">{id}</span>
            {isCondition && node.variable && (
              <span className="text-xs text-slate-dim ml-2">
                {node.variable}{" "}
                <span className="text-cyan/60">{node.operator}</span>
                {node.value && (
                  <span className="text-amber-400/60 ml-1 truncate inline-block max-w-[200px] align-bottom">
                    {node.value}
                  </span>
                )}
              </span>
            )}
            {!isCondition && node.returnValue && (
              <span className="text-xs text-emerald-400/60 ml-2">
                {JSON.stringify(node.returnValue)}
              </span>
            )}
          </div>
        </div>
        {isCondition && node.trueNext && (
          <div style={{ marginLeft: indent + 12 }}>
            <span className="text-[10px] font-mono text-emerald-400/50 ml-2">
              true
            </span>
            {renderNode(node.trueNext, depth + 1, visited)}
          </div>
        )}
        {isCondition && node.falseNext && (
          <div style={{ marginLeft: indent + 12 }}>
            <span className="text-[10px] font-mono text-red-400/50 ml-2">
              false
            </span>
            {renderNode(node.falseNext, depth + 1, visited)}
          </div>
        )}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-dim text-sm">
        Tree data not available for this microgram yet
      </div>
    );
  }

  return (
    <div className="font-mono text-sm overflow-x-auto">
      {renderNode(startId, 0, new Set())}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view — receives real data from server component
// ---------------------------------------------------------------------------

export function MicrogramDetailView({ mg }: { mg: MicrogramDetail }) {
  const hasData = mg.nodes.length > 0;

  return (
    <div className="min-h-screen p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href="/nucleus/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-slate-dim hover:text-cyan transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold font-mono text-slate-light">
              {mg.name}
            </h1>
            <p className="text-slate-dim text-sm mt-1">{mg.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {mg.verified && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            <Badge variant="outline">v{mg.version}</Badge>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-dim">
          <Badge variant="outline" className={domainColor(mg.domain)}>
            {mg.domain}
          </Badge>
          <span className="flex items-center gap-1.5">
            <GitBranch className="h-4 w-4" />
            {mg.nodeCount} nodes
          </span>
          <span className="flex items-center gap-1.5">
            <FlaskConical className="h-4 w-4" />
            {mg.testCount} tests
          </span>
          {mg.downloads > 0 && (
            <span className="flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              {mg.downloads} downloads
            </span>
          )}
          <span>by {mg.author}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Tree + Tests */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TreeDeciduous className="h-4 w-4 text-cyan" />
                Decision Tree
              </CardTitle>
              {hasData && (
                <CardDescription className="text-xs">
                  Start node:{" "}
                  <code className="text-cyan/70">{mg.nodes[0]?.id}</code>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <TreeVisualization
                nodes={mg.nodes}
                startId={mg.nodes[0]?.id ?? ""}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-amber-400" />
                Test Cases ({mg.tests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mg.tests.length === 0 ? (
                <div className="text-center py-6 text-slate-dim text-sm">
                  Test data not available yet
                </div>
              ) : (
                <div className="space-y-2">
                  {mg.tests.map((test, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded bg-nex-surface/20 text-xs font-mono"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {test.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div>
                          <span className="text-slate-dim">input: </span>
                          <span className="text-slate-light">
                            {JSON.stringify(test.input)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-dim">expect: </span>
                          <span className="text-emerald-400/70">
                            {JSON.stringify(test.expect)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Gates + Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Install</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-nex-surface/40 p-2 rounded text-cyan/70 truncate">
                  rsk mcg get {mg.name}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() =>
                    navigator.clipboard.writeText(`rsk mcg get ${mg.name}`)
                  }
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button className="w-full" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download YAML
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Operators Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {mg.operators.map((op) => (
                  <Badge
                    key={op}
                    variant="outline"
                    className="font-mono text-xs"
                  >
                    {op}
                  </Badge>
                ))}
              </div>
              {mg.hasInterface && (
                <Badge className="mt-3 bg-cyan/10 text-cyan/70 border-cyan/20">
                  Typed Interface
                </Badge>
              )}
            </CardContent>
          </Card>

          {mg.gateResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Validation Gates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {mg.gateResults.map((gate) => (
                  <div
                    key={gate.name}
                    className="flex items-center gap-2 text-xs"
                  >
                    {gate.passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    )}
                    <span className="font-medium text-slate-light">
                      {gate.name}
                    </span>
                    <span className="text-slate-dim/60 truncate">
                      {gate.detail}
                    </span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-nex-border/20">
                  <span className="text-xs text-emerald-400 font-medium">
                    {mg.gateResults.filter((g) => g.passed).length}/
                    {mg.gateResults.length} gates passed
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
