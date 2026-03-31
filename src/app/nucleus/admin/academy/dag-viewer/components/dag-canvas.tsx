'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  AtomizedPathway,
  AtomicLearningObject,
  AloEdge,
  AloType,
  AloEdgeType,
} from '@/types/academy-graph';
import { NodeDetail } from './node-detail';

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W = 160;
const NODE_H_BASE = 80;
const H_GAP = 18;
const ROW_H = 96;   // fixed row height (tallest node fits)
const V_GAP = 72;   // vertical gap between rows (space for edge paths)
const PAD_X = 124;  // left padding reserved for stage labels
const PAD_Y = 36;

// ─── Style maps ───────────────────────────────────────────────────────────────

const NODE_STYLE: Record<AloType, string> = {
  hook:       'border-amber-500/50 bg-amber-950/30 hover:border-amber-400/80 hover:bg-amber-950/50',
  concept:    'border-blue-500/50 bg-blue-950/30 hover:border-blue-400/80 hover:bg-blue-950/50',
  activity:   'border-emerald-500/50 bg-emerald-950/30 hover:border-emerald-400/80 hover:bg-emerald-950/50',
  reflection: 'border-purple-500/50 bg-purple-950/30 hover:border-purple-400/80 hover:bg-purple-950/50',
};

const BADGE_STYLE: Record<AloType, string> = {
  hook:       'border-amber-500/30 bg-amber-500/10 text-amber-300',
  concept:    'border-blue-500/30 bg-blue-500/10 text-blue-300',
  activity:   'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  reflection: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
};

interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

const EDGE_STYLE: Record<AloEdgeType, EdgeStyle> = {
  prereq:     { stroke: '#64748b', strokeWidth: 1.5 },
  extends:    { stroke: '#60a5fa', strokeWidth: 1.5, strokeDasharray: '6 3' },
  assesses:   { stroke: '#fbbf24', strokeWidth: 1.5, strokeDasharray: '2 3' },
  strengthens:{ stroke: '#34d399', strokeWidth: 2.0 },
  coreq:      { stroke: '#c084fc', strokeWidth: 1.5, strokeDasharray: '5 2' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodePos {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AloNodeProps {
  alo: AtomicLearningObject;
  pos: NodePos;
  selected: boolean;
  onClick: () => void;
}

function AloNode({ alo, pos, selected, onClick }: AloNodeProps) {
  return (
    <Card
      className={[
        'absolute cursor-pointer border transition-all duration-150 overflow-hidden',
        NODE_STYLE[alo.alo_type],
        selected ? 'ring-2 ring-white/30 shadow-lg shadow-white/5' : '',
      ].join(' ')}
      style={{ left: pos.x, top: pos.y, width: pos.width, height: pos.height }}
      onClick={onClick}
    >
      <div className="flex h-full flex-col justify-between p-2">
        <div className="flex items-start justify-between gap-1">
          <Badge
            variant="outline"
            className={`text-[9px] px-1 py-0 leading-4 ${BADGE_STYLE[alo.alo_type]}`}
          >
            {alo.alo_type}
          </Badge>
          <span className="text-[9px] text-slate-500 tabular-nums">
            {alo.estimated_duration}m
          </span>
        </div>
        <p className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-200">
          {alo.title}
        </p>
        <p className="text-[9px] text-slate-500">{alo.bloom_level}</p>
      </div>
    </Card>
  );
}

interface EdgePathProps {
  edge: AloEdge;
  from: NodePos;
  to: NodePos;
}

function EdgePath({ edge, from, to }: EdgePathProps) {
  const style = EDGE_STYLE[edge.edge_type];
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;

  let d: string;

  // Same-row edge (coreq / lateral): arc below both nodes
  if (Math.abs(from.y - to.y) < ROW_H) {
    const arcY = Math.max(from.y + from.height, to.y + to.height) + 20;
    d = `M ${x1} ${y1} C ${x1} ${arcY} ${x2} ${arcY} ${x2} ${y2}`;
  } else {
    // Forward edge: cubic bezier top-to-bottom
    const dy = Math.abs(y2 - y1);
    const cp = Math.min(dy * 0.45, 64);
    d = `M ${x1} ${y1} C ${x1} ${y1 + cp} ${x2} ${y2 - cp} ${x2} ${y2}`;
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={style.stroke}
      strokeWidth={style.strokeWidth}
      strokeDasharray={style.strokeDasharray}
      markerEnd="url(#dag-arrow)"
      opacity={0.65}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DagCanvasProps {
  pathway: AtomizedPathway;
}

export function DagCanvas({ pathway }: DagCanvasProps) {
  const [selected, setSelected] = useState<AtomicLearningObject | null>(null);

  // Group ALOs by stage, preserving insertion order
  const stageMap = new Map<string, AtomicLearningObject[]>();
  for (const alo of pathway.alos) {
    const bucket = stageMap.get(alo.source_stage_id) ?? [];
    bucket.push(alo);
    stageMap.set(alo.source_stage_id, bucket);
  }
  const stageIds = Array.from(stageMap.keys());

  // Scale node height by duration
  function nodeHeight(duration: number): number {
    return Math.max(NODE_H_BASE, NODE_H_BASE + Math.floor((duration - 2) / 3) * 8);
  }

  // Compute absolute positions
  const positions = new Map<string, NodePos>();
  let canvasW = 0;
  let canvasH = 0;

  stageIds.forEach((stageId, rowIdx) => {
    const alos = stageMap.get(stageId) ?? [];
    const rowY = PAD_Y + rowIdx * (ROW_H + V_GAP);
    alos.forEach((alo, colIdx) => {
      const h = nodeHeight(alo.estimated_duration);
      const x = PAD_X + colIdx * (NODE_W + H_GAP);
      const y = rowY + Math.floor((ROW_H - h) / 2); // vertically centered in row
      positions.set(alo.id, { x, y, width: NODE_W, height: h });
      canvasW = Math.max(canvasW, x + NODE_W + PAD_X / 2);
      canvasH = Math.max(canvasH, rowY + ROW_H + PAD_Y);
    });
  });

  const handleClick = useCallback(
    (alo: AtomicLearningObject) => {
      setSelected(prev => (prev?.id === alo.id ? null : alo));
    },
    [],
  );

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Scrollable canvas ──────────────────────────────────────────── */}
      <div className="relative flex-1 overflow-auto bg-slate-950/60">
        <div
          className="relative"
          style={{ width: Math.max(canvasW, 800), height: Math.max(canvasH, 400) }}
        >
          {/* SVG edge layer */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={canvasW}
            height={canvasH}
          >
            <defs>
              <marker
                id="dag-arrow"
                markerWidth="6"
                markerHeight="4"
                refX="5"
                refY="2"
                orient="auto"
              >
                <path d="M0,0 L6,2 L0,4 Z" fill="#64748b" />
              </marker>
            </defs>

            {pathway.edges.map((edge, idx) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;
              return <EdgePath key={idx} edge={edge} from={from} to={to} />;
            })}
          </svg>

          {/* Stage labels */}
          {stageIds.map((stageId, rowIdx) => (
            <div
              key={`lbl-${stageId}`}
              className="absolute flex items-center justify-end pr-3"
              style={{
                left: 0,
                top: PAD_Y + rowIdx * (ROW_H + V_GAP),
                width: PAD_X - 4,
                height: ROW_H,
              }}
            >
              <span className="text-right text-[9px] font-semibold uppercase tracking-widest text-slate-600 leading-tight">
                {stageId}
              </span>
            </div>
          ))}

          {/* Stage row separator lines */}
          {stageIds.map((stageId, rowIdx) => (
            <div
              key={`sep-${stageId}`}
              className="absolute left-0 right-0 border-b border-slate-800/30"
              style={{ top: PAD_Y + rowIdx * (ROW_H + V_GAP) + ROW_H + V_GAP / 2 }}
            />
          ))}

          {/* ALO nodes */}
          {pathway.alos.map(alo => {
            const pos = positions.get(alo.id);
            if (!pos) return null;
            return (
              <AloNode
                key={alo.id}
                alo={alo}
                pos={pos}
                selected={selected?.id === alo.id}
                onClick={() => handleClick(alo)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Detail panel (slides in) ───────────────────────────────────── */}
      {selected && (
        <NodeDetail node={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
