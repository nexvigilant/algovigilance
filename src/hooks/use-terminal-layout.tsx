'use client';

/**
 * useTerminalLayout — state management for split-pane terminal layout.
 *
 * Provides a reducer-based layout tree with context for the component tree.
 * Simplified model: one session per pane, no tabs within panes.
 */

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { TerminalMode } from '@/types/terminal';
import {
  type TerminalLayout,
  type LayoutNode,
  type LeafNode,
  type SplitDirection,
  createLeaf,
  countLeaves,
} from '@/types/terminal-layout';

// ── Actions ──────────────────────────────────────────────

interface SplitPaneAction {
  type: 'SPLIT_PANE';
  paneId: string;
  direction: SplitDirection;
  /** Maximum number of panes allowed by tier. */
  maxPanes: number;
}

interface ClosePaneAction {
  type: 'CLOSE_PANE';
  paneId: string;
}

interface FocusPaneAction {
  type: 'FOCUS_PANE';
  paneId: string;
}

interface ResizeSplitAction {
  type: 'RESIZE_SPLIT';
  splitId: string;
  ratio: number;
}

interface SetSessionAction {
  type: 'SET_SESSION';
  paneId: string;
  sessionId: string;
}

interface SetLayoutAction {
  type: 'SET_LAYOUT';
  layout: TerminalLayout;
}

export type LayoutAction =
  | SplitPaneAction
  | ClosePaneAction
  | FocusPaneAction
  | ResizeSplitAction
  | SetSessionAction
  | SetLayoutAction;

// ── Tree Manipulation Helpers ────────────────────────────

/** Find a node by ID in the tree. Returns the node or undefined. */
function findNode(root: LayoutNode, id: string): LayoutNode | undefined {
  if (root.id === id) return root;
  if (root.type === 'split') {
    return findNode(root.children[0], id) ?? findNode(root.children[1], id);
  }
  return undefined;
}

/**
 * Replace a node in the tree by ID, returning a new tree.
 * Returns undefined if the target ID was not found.
 */
function replaceNode(
  root: LayoutNode,
  targetId: string,
  replacement: LayoutNode,
): LayoutNode | undefined {
  if (root.id === targetId) return replacement;

  if (root.type === 'split') {
    const left = replaceNode(root.children[0], targetId, replacement);
    if (left) {
      return { ...root, children: [left, root.children[1]] };
    }
    const right = replaceNode(root.children[1], targetId, replacement);
    if (right) {
      return { ...root, children: [root.children[0], right] };
    }
  }

  return undefined;
}

/**
 * Remove a leaf from the tree, collapsing its parent split to the sibling.
 * Returns the new tree root, or undefined if the leaf is the root (can't remove last pane).
 */
function removeLeaf(root: LayoutNode, leafId: string): LayoutNode | undefined {
  // Can't remove the root leaf
  if (root.type === 'leaf') return undefined;

  // Check if either child of this split is the target
  const [left, right] = root.children;

  if (left.id === leafId) return right;
  if (right.id === leafId) return left;

  // Recurse into children
  if (left.type === 'split') {
    const result = removeLeaf(left, leafId);
    if (result) {
      return { ...root, children: [result, right] };
    }
  }
  if (right.type === 'split') {
    const result = removeLeaf(right, leafId);
    if (result) {
      return { ...root, children: [left, result] };
    }
  }

  return undefined;
}

/** Find the first leaf node in the tree (depth-first, left-biased). */
function firstLeaf(node: LayoutNode): LeafNode {
  if (node.type === 'leaf') return node;
  return firstLeaf(node.children[0]);
}

// ── Reducer ──────────────────────────────────────────────

export function layoutReducer(state: TerminalLayout, action: LayoutAction): TerminalLayout {
  switch (action.type) {
    case 'SPLIT_PANE': {
      // Pre-flight: check tier limit
      if (countLeaves(state.root) >= action.maxPanes) {
        return state;
      }

      const target = findNode(state.root, action.paneId);
      if (!target || target.type !== 'leaf') return state;

      const newLeaf = createLeaf(target.mode);
      const splitNode: LayoutNode = {
        type: 'split',
        id: crypto.randomUUID(),
        direction: action.direction,
        ratio: 0.5,
        children: [target, newLeaf],
      };

      const newRoot = replaceNode(state.root, action.paneId, splitNode);
      if (!newRoot) return state;

      return {
        ...state,
        root: newRoot,
        focused_pane: newLeaf.id,
      };
    }

    case 'CLOSE_PANE': {
      const result = removeLeaf(state.root, action.paneId);
      // Can't close the last pane
      if (!result) return state;

      // If the closed pane was focused, move focus to the first leaf
      const needsRefocus = state.focused_pane === action.paneId;
      return {
        ...state,
        root: result,
        focused_pane: needsRefocus ? firstLeaf(result).id : state.focused_pane,
      };
    }

    case 'FOCUS_PANE': {
      const target = findNode(state.root, action.paneId);
      if (!target || target.type !== 'leaf') return state;
      return { ...state, focused_pane: action.paneId };
    }

    case 'RESIZE_SPLIT': {
      const target = findNode(state.root, action.splitId);
      if (!target || target.type !== 'split') return state;

      const clamped = Math.max(0.1, Math.min(0.9, action.ratio));
      const updated: LayoutNode = { ...target, ratio: clamped };
      const newRoot = replaceNode(state.root, action.splitId, updated);
      if (!newRoot) return state;

      return { ...state, root: newRoot };
    }

    case 'SET_SESSION': {
      const target = findNode(state.root, action.paneId);
      if (!target || target.type !== 'leaf') return state;

      const updated: LayoutNode = { ...target, session_id: action.sessionId };
      const newRoot = replaceNode(state.root, action.paneId, updated);
      if (!newRoot) return state;

      return { ...state, root: newRoot };
    }

    case 'SET_LAYOUT': {
      return action.layout;
    }
  }
}

// ── Context ──────────────────────────────────────────────

interface LayoutContextValue {
  layout: TerminalLayout;
  dispatch: Dispatch<LayoutAction>;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

interface LayoutProviderProps {
  initialMode: TerminalMode;
  children: ReactNode;
}

export function LayoutProvider({ initialMode, children }: LayoutProviderProps) {
  const initialLeaf = createLeaf(initialMode);
  const initialLayout: TerminalLayout = {
    version: 1,
    root: initialLeaf,
    focused_pane: initialLeaf.id,
  };

  const [layout, dispatch] = useReducer(layoutReducer, initialLayout);

  return (
    <LayoutContext value={{ layout, dispatch }}>
      {children}
    </LayoutContext>
  );
}

/** Access the terminal layout context. Must be used within a LayoutProvider. */
export function useTerminalLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useTerminalLayout must be used within a LayoutProvider');
  }
  return ctx;
}
