"use client";

import { JargonBuster } from "@/components/pv-for-nexvigilants";
import type { FlywheelNode } from "@/lib/pv-compute/flywheel";

// ─── Graph definition ─────────────────────────────────────────────────────────
//
// Dependency topology:
//   5 (Elastic) → 1 (Rim)   — elastic feeds rim
//   1 (Rim)     → 2 (Momentum) — rim drives momentum
//   2 (Momentum)→ 4 (Gyro)  — momentum powers stability
//   3 (Friction)→ 2 (Momentum) — friction DRAINS momentum [antagonist]
//
// Main chain: 5 → 1 → 2 → 4
// Antagonist: 3 → 2 (drains)

interface LoopNode {
  id: number;
  shortName: string;
  friendlyName: string;
  col: number; // 0-indexed column position
  row: number; // 0-indexed row position
  color: string;
  bgColor: string;
  borderColor: string;
}

interface LoopEdge {
  from: number;
  to: number;
  label: string;
  isAntagonist: boolean;
}

const NODES: LoopNode[] = [
  {
    id: 5,
    shortName: "L5",
    friendlyName: "Elastic\nEquilibrium",
    col: 0,
    row: 0,
    color: "text-purple-300",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    id: 1,
    shortName: "L1",
    friendlyName: "Rim\nIntegrity",
    col: 1,
    row: 0,
    color: "text-cyan-300",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  {
    id: 2,
    shortName: "L2",
    friendlyName: "Momentum\nConservation",
    col: 2,
    row: 0,
    color: "text-emerald-300",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  {
    id: 4,
    shortName: "L4",
    friendlyName: "Gyroscopic\nStability",
    col: 3,
    row: 0,
    color: "text-blue-300",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: 3,
    shortName: "L3",
    friendlyName: "Friction\nDissipation",
    col: 2,
    row: 1,
    color: "text-red-300",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
];

const EDGES: LoopEdge[] = [
  { from: 5, to: 1, label: "elastic\nfeeds rim", isAntagonist: false },
  { from: 1, to: 2, label: "rim drives\nmomentum", isAntagonist: false },
  { from: 2, to: 4, label: "momentum\npowers stability", isAntagonist: false },
  { from: 3, to: 2, label: "friction\ndrains momentum", isAntagonist: true },
];

// ─── SVG layout constants ─────────────────────────────────────────────────────
// The main chain runs left-to-right on row 0.
// L3 (antagonist) sits below L2, with an upward arrow into L2.

const NODE_W = 88;
const NODE_H = 56;
const COL_GAP = 80;
const ROW_GAP = 72;
const PADDING = 16;

function nodeCenter(n: LoopNode): [number, number] {
  const x = PADDING + n.col * (NODE_W + COL_GAP) + NODE_W / 2;
  const y = PADDING + n.row * (NODE_H + ROW_GAP) + NODE_H / 2;
  return [x, y];
}

const SVG_W = PADDING * 2 + 4 * (NODE_W + COL_GAP) - COL_GAP + 0; // 4 columns
const SVG_H = PADDING * 2 + 2 * NODE_H + ROW_GAP;

function Arrow({ edge, nodes }: { edge: LoopEdge; nodes: LoopNode[] }) {
  const from = nodes.find((n) => n.id === edge.from)!;
  const to = nodes.find((n) => n.id === edge.to)!;
  const [fx, fy] = nodeCenter(from);
  const [tx, ty] = nodeCenter(to);

  // For horizontal arrows (same row): start at right edge of from, end at left edge of to
  // For vertical arrows (L3 → L2, L3 is below): start at top edge of from, end at bottom edge of to
  const isVertical = from.row !== to.row;

  let x1: number, y1: number, x2: number, y2: number;
  if (isVertical) {
    // L3 is below L2: arrow goes upward
    x1 = fx;
    y1 = fy - NODE_H / 2; // top of L3
    x2 = tx;
    y2 = ty + NODE_H / 2; // bottom of L2
  } else {
    x1 = fx + NODE_W / 2; // right of from
    y1 = fy;
    x2 = tx - NODE_W / 2; // left of to
    y2 = ty;
  }

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const stroke = edge.isAntagonist ? "#f87171" : "#94a3b8";
  const strokeDash = edge.isAntagonist ? "5 3" : undefined;
  const markerColor = edge.isAntagonist ? "url(#arrowRed)" : "url(#arrowGray)";

  // For vertical edge, shift label slightly to the right so it doesn't overlap the line
  const labelX = isVertical ? midX + 10 : midX;
  const labelY = isVertical ? midY : midY - 8;

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={isVertical ? 1.5 : 1.5}
        strokeDasharray={strokeDash}
        markerEnd={markerColor}
      />
      {edge.label.split("\n").map((line, i) => (
        <text
          key={i}
          x={labelX}
          y={labelY + i * 11}
          textAnchor="middle"
          fontSize={8}
          fill={edge.isAntagonist ? "#f87171" : "#94a3b8"}
          fontFamily="monospace"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function NodeBox({ node }: { node: LoopNode }) {
  const [cx, cy] = nodeCenter(node);
  const x = cx - NODE_W / 2;
  const y = cy - NODE_H / 2;

  const fillColor =
    node.id === 3 ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)";
  const strokeColor =
    node.id === 3 ? "rgba(239,68,68,0.30)" : "rgba(255,255,255,0.10)";
  const labelColor = node.id === 3 ? "#fca5a5" : "#e2e8f0";
  const idColor = node.id === 3 ? "#f87171" : "#94a3b8";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={6}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
      />
      <text
        x={cx}
        y={y + 14}
        textAnchor="middle"
        fontSize={8}
        fill={idColor}
        fontFamily="monospace"
        fontWeight="bold"
      >
        Loop {node.id}
      </text>
      {node.friendlyName.split("\n").map((line, i) => (
        <text
          key={i}
          x={cx}
          y={y + 28 + i * 12}
          textAnchor="middle"
          fontSize={9}
          fill={labelColor}
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FlywheelCascadeViz() {
  return (
    <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
      <h2 className="text-sm font-semibold text-foreground mb-1">
        How the Loops Interact
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        The 5 loops form a{" "}
        <JargonBuster
          term="Cascade"
          definition="A chain where each loop feeds the next. When Loop 5 is healthy it strengthens Loop 1, which builds Loop 2's momentum — and so on. One weak link breaks the chain."
        >
          cascade
        </JargonBuster>
        . Arrows show which loops feed which. The{" "}
        <span className="text-red-400 font-medium">red dashed arrow</span> is
        the antagonist — Friction constantly drains Momentum.
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width={SVG_W}
          height={SVG_H}
          aria-label="Flywheel loop dependency graph"
          role="img"
        >
          <defs>
            <marker
              id="arrowGray"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
            <marker
              id="arrowRed"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
            </marker>
          </defs>

          {/* Edges first so they appear behind nodes */}
          {EDGES.map((edge) => (
            <Arrow key={`${edge.from}-${edge.to}`} edge={edge} nodes={NODES} />
          ))}

          {/* Node boxes */}
          {NODES.map((node) => (
            <NodeBox key={node.id} node={node} />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-6 border-t border-slate-400" />
          <span>Feeds (positive)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 border-t border-dashed border-red-400" />
          <span className="text-red-400">Drains (antagonist)</span>
        </div>
      </div>
    </div>
  );
}
