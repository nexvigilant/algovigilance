/**
 * Terminal layout types — split-pane tree structure.
 *
 * Simplified model: one session per pane (LeafNode), no tabs within panes.
 * Layout is a binary tree where internal nodes are splits and leaves are panes.
 *
 * Mirrors a future Rust struct with serde(tag = "type", rename_all = "snake_case").
 */

import type { TerminalMode } from './terminal';

// ── Primitives ───────────────────────────────────────────

/** Split orientation — horizontal splits top/bottom, vertical splits left/right. */
export type SplitDirection = 'horizontal' | 'vertical';

// ── Tree Nodes ───────────────────────────────────────────

/** Leaf node — a single terminal pane with one session. */
export interface LeafNode {
  type: 'leaf';
  /** Client-generated pane ID (crypto.randomUUID()). */
  id: string;
  /** Terminal mode for this pane's session. */
  mode: TerminalMode;
  /** Server-assigned session ID (set after WS connect, undefined until then). */
  session_id?: string;
}

/** Split node — divides space between two children. */
export interface SplitNode {
  type: 'split';
  /** Client-generated split ID. */
  id: string;
  /** Split orientation. */
  direction: SplitDirection;
  /** Fraction of space allocated to the first (left/top) child. Range [0.1, 0.9]. */
  ratio: number;
  /** Exactly two children — each is either a leaf or another split. */
  children: [LayoutNode, LayoutNode];
}

/** A node in the layout tree — either a leaf pane or a split. */
export type LayoutNode = LeafNode | SplitNode;

// ── Root Container ───────────────────────────────────────

/** Complete terminal layout state. Persisted per (tenant, user). */
export interface TerminalLayout {
  /** Schema version for future migrations. */
  version: 1;
  /** Root of the layout tree. */
  root: LayoutNode;
  /** ID of the currently focused LeafNode. */
  focused_pane: string;
}

// ── Helpers ──────────────────────────────────────────────

/** Create a new leaf pane with a unique ID. */
export function createLeaf(mode: TerminalMode): LeafNode {
  return {
    type: 'leaf',
    id: crypto.randomUUID(),
    mode,
  };
}

/** Count the number of leaf nodes (panes) in a layout tree. */
export function countLeaves(node: LayoutNode): number {
  if (node.type === 'leaf') return 1;
  return countLeaves(node.children[0]) + countLeaves(node.children[1]);
}

/** Collect all leaf nodes in tree order (left-to-right, top-to-bottom). */
export function collectLeaves(node: LayoutNode): LeafNode[] {
  if (node.type === 'leaf') return [node];
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])];
}
