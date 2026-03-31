"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import type {
  FlywheelNode as PvFlywheelNode,
  FlywheelTier,
} from "@/lib/pv-compute/flywheel";
import { Server, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type {
  FlywheelStatusResult,
  FlywheelNode,
  NodeTier,
} from "./flywheel-types";

interface FlywheelNodeTopologyProps {
  status: FlywheelStatusResult | null;
}

const tierOrder: NodeTier[] = ["Live", "Staging", "Draft"];

const tierColors: Record<NodeTier, { border: string; badge: string }> = {
  Live: {
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  Staging: {
    border: "border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  Draft: {
    border: "border-slate-500/20",
    badge: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  },
};

function StatusIcon({ status }: { status: FlywheelNode["status"] }) {
  if (status === "active")
    return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-red-400" />;
  if (status === "wiring")
    return <AlertCircle className="h-4 w-4 text-amber-400" />;
  // dormant or inactive
  return <AlertCircle className="h-4 w-4 text-slate-400" />;
}

function NodeCard({ node }: { node: FlywheelNode }) {
  const colors = tierColors[node.tier];

  return (
    <Card className={`border ${colors.border} bg-white/[0.02] p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {node.name}
          </span>
        </div>
        <StatusIcon status={node.status} />
      </div>

      <div>
        <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono mb-1">
          {node.crates.length} Crate{node.crates.length !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {node.crates.join(", ")}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`text-[10px] font-mono capitalize ${
            node.status === "active"
              ? "text-emerald-400"
              : node.status === "wiring"
                ? "text-amber-400"
                : "text-slate-400"
          }`}
        >
          {node.status}
        </span>
      </div>
    </Card>
  );
}

export function FlywheelNodeTopology({ status }: FlywheelNodeTopologyProps) {
  if (!status) {
    return (
      <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Where Are Your Nodes?
        </h2>
        <p className="text-xs text-muted-foreground">
          No node data available. NexCore may be offline.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
      <h2 className="text-sm font-semibold text-foreground mb-1">
        Where Are Your{" "}
        <JargonBuster
          term="Nodes"
          definition="Independent units in the flywheel — each node runs micrograms (decision programs) and emits events. Nodes are grouped into tiers: Live (production), Staging (testing), and Draft (development)."
        >
          Nodes
        </JargonBuster>
        ?
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Each node runs decision programs and reports activity via{" "}
        <JargonBuster
          term="Emitters"
          definition="Rust modules inside each node that send events into the flywheel whenever something is detected or fixed. More emitters = more signal coverage."
        >
          emitters
        </JargonBuster>
        . Green means healthy.
      </p>

      {/* Summary strip */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-sm text-muted-foreground">
          <span className="font-mono font-bold text-foreground">
            {status.nodes.length}
          </span>{" "}
          nodes across{" "}
          <span className="font-mono font-bold text-foreground">
            {Object.keys(status.tier_counts).length}
          </span>{" "}
          <JargonBuster
            term="Tiers"
            definition="Groups that show how ready a node is: Live means production-ready, Staging means being tested, Draft means still in development."
          >
            tiers
          </JargonBuster>
        </div>
        <div className="flex gap-2">
          {tierOrder.map((tier) => {
            const count = status.tier_counts[tier] ?? 0;
            if (count === 0) return null;
            const colors = tierColors[tier];
            return (
              <Badge
                key={tier}
                variant="outline"
                className={`${colors.badge} text-[10px]`}
              >
                {tier}: {count}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Tier grids */}
      {tierOrder.map((tier) => {
        const nodes = status.nodes.filter((n) => n.tier === tier);
        if (nodes.length === 0) return null;
        return (
          <div key={tier} className="mb-6 last:mb-0">
            <h3 className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono mb-3">
              {tier} Tier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {nodes.map((node) => (
                <NodeCard key={node.name} node={node} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Totals */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono">
            Total Nodes
          </p>
          <p className="text-lg font-bold font-mono text-foreground">
            {status.total_nodes}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono">
            Active
          </p>
          <p className="text-lg font-bold font-mono text-emerald-400">
            {status.active_nodes}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono">
            Total Crates
          </p>
          <p className="text-lg font-bold font-mono text-foreground">
            {status.nodes.reduce((sum, n) => sum + n.crates.length, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
