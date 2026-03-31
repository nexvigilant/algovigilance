'use client';

/**
 * TerminalSplitView — recursive renderer for the layout tree.
 *
 * Renders LeafNode as TerminalPane, SplitNode as flex container
 * with two recursive children and a draggable divider between them.
 */

import { useRef, useCallback, useState } from 'react';
import { useTerminalLayout } from '@/hooks/use-terminal-layout';
import { TerminalPane } from './TerminalPane';
import type { LayoutNode } from '@/types/terminal-layout';
import type { TerminalMode, TerminalConnectParams, TerminalPreferences } from '@/types/terminal';

// ── Props ────────────────────────────────────────────────

export interface TerminalSplitViewProps {
  node: LayoutNode;
  prefs: TerminalPreferences;
  connectParams: TerminalConnectParams;
  focusedPaneId: string;
  onPaneFocus: (paneId: string) => void;
  onSessionCreated: (paneId: string, sessionId: string) => void;
  onModeChange: (paneId: string, mode: TerminalMode) => void;
}

// ── Leaf renderer ────────────────────────────────────────

function LeafView({
  node,
  prefs,
  connectParams,
  focusedPaneId,
  onPaneFocus,
  onSessionCreated,
  onModeChange,
}: TerminalSplitViewProps & { node: Extract<LayoutNode, { type: 'leaf' }> }) {
  const isFocused = focusedPaneId === node.id;
  const paneId = node.id;

  const handleFocus = useCallback(() => onPaneFocus(paneId), [onPaneFocus, paneId]);
  const handleSession = useCallback(
    (sessionId: string) => onSessionCreated(paneId, sessionId),
    [onSessionCreated, paneId],
  );
  const handleMode = useCallback(
    (mode: TerminalMode) => onModeChange(paneId, mode),
    [onModeChange, paneId],
  );

  return (
    <TerminalPane
      paneId={paneId}
      mode={node.mode}
      prefs={prefs}
      connectParams={connectParams}
      isFocused={isFocused}
      onFocus={handleFocus}
      onSessionCreated={handleSession}
      onModeChange={handleMode}
    />
  );
}

// ── Draggable divider ────────────────────────────────────

interface DividerProps {
  splitId: string;
  direction: 'horizontal' | 'vertical';
}

function SplitDivider({ splitId, direction }: DividerProps) {
  const { dispatch } = useTerminalLayout();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);

    const divider = e.currentTarget;
    const parent = divider.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const isVertical = direction === 'vertical';

    const onMouseMove = (ev: MouseEvent) => {
      // Live visual feedback via CSS variable on the parent
      const pos = isVertical ? ev.clientX - rect.left : ev.clientY - rect.top;
      const total = isVertical ? rect.width : rect.height;
      const ratio = Math.max(0.1, Math.min(0.9, pos / total));
      parent.style.setProperty('--split-ratio', String(ratio));
    };

    const onMouseUp = (ev: MouseEvent) => {
      const pos = isVertical ? ev.clientX - rect.left : ev.clientY - rect.top;
      const total = isVertical ? rect.width : rect.height;
      const ratio = Math.max(0.1, Math.min(0.9, pos / total));
      dispatch({ type: 'RESIZE_SPLIT', splitId, ratio });
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [direction, dispatch, splitId]);

  const isVertical = direction === 'vertical';
  const cursorClass = isVertical ? 'cursor-col-resize' : 'cursor-row-resize';
  const sizeClass = isVertical ? 'w-1 min-w-1' : 'h-1 min-h-1';
  const hoverBg = isDragging ? 'bg-cyan-400' : 'bg-white/5 hover:bg-cyan-400/60';

  return (
    <div
      ref={containerRef}
      className={`${sizeClass} ${cursorClass} ${hoverBg} shrink-0 transition-colors duration-150`}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      tabIndex={0}
    />
  );
}

// ── Split renderer ───────────────────────────────────────

function SplitView(props: TerminalSplitViewProps & { node: Extract<LayoutNode, { type: 'split' }> }) {
  const { node } = props;
  const isVertical = node.direction === 'vertical';
  const flexDir = isVertical ? 'flex-row' : 'flex-col';

  // Use CSS custom property for live drag feedback; fall back to reducer ratio
  const firstBasis = `calc(var(--split-ratio, ${node.ratio}) * 100%)`;
  const secondBasis = `calc((1 - var(--split-ratio, ${node.ratio})) * 100%)`;

  // Subtract divider width from each child's basis (w-1 / h-1 = 0.25rem = 4px)
  const dividerSize = '4px';

  return (
    <div className={`flex ${flexDir} flex-1 min-h-0 min-w-0`}>
      <div
        className="flex min-h-0 min-w-0 overflow-hidden"
        style={{ flexBasis: firstBasis, flexGrow: 0, flexShrink: 0, maxWidth: isVertical ? `calc(100% - ${dividerSize})` : undefined, maxHeight: !isVertical ? `calc(100% - ${dividerSize})` : undefined }}
      >
        <TerminalSplitView {...props} node={node.children[0]} />
      </div>
      <SplitDivider splitId={node.id} direction={node.direction} />
      <div
        className="flex min-h-0 min-w-0 overflow-hidden"
        style={{ flexBasis: secondBasis, flexGrow: 0, flexShrink: 0, maxWidth: isVertical ? `calc(100% - ${dividerSize})` : undefined, maxHeight: !isVertical ? `calc(100% - ${dividerSize})` : undefined }}
      >
        <TerminalSplitView {...props} node={node.children[1]} />
      </div>
    </div>
  );
}

// ── Recursive dispatcher ─────────────────────────────────

export function TerminalSplitView(props: TerminalSplitViewProps) {
  const { node } = props;

  if (node.type === 'leaf') {
    return <LeafView {...props} node={node} />;
  }

  return <SplitView {...props} node={node} />;
}
