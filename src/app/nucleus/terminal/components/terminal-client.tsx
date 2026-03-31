'use client';

/**
 * TerminalClient — layout container for split-pane terminal.
 *
 * Owns: preferences state, global keyboard shortcuts (font zoom,
 * split, close, focus navigation), layout provider, and pane orchestration.
 * Delegates: xterm lifecycle, WS connection, search, mode cycling,
 * and status bar to TerminalPane (rendered via TerminalSplitView).
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { LayoutProvider, useTerminalLayout } from '@/hooks/use-terminal-layout';
import { TerminalSplitView } from './TerminalSplitView';
import { TerminalWsContext, type TerminalWsContextValue } from './terminal-ws-context';
import { logger } from '@/lib/logger';
import { collectLeaves } from '@/types/terminal-layout';
import type { LayoutNode, TerminalLayout } from '@/types/terminal-layout';
import type { TerminalMode, TerminalConnectParams, TerminalPreferences } from '@/types/terminal';
import { useKeybindings } from '@/hooks/use-keybindings';
import { DEFAULT_KEYBINDINGS } from '@/types/terminal-keybindings';
import type { KeybindingSet } from '@/types/terminal-keybindings';

const log = logger.scope('terminal-container');

// ── Default preferences (matches Rust TerminalPreferences::default()) ──

const DEFAULT_PREFS: TerminalPreferences = {
  font_size: 14,
  font_family: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
  line_height: 1.2,
  cursor_style: 'block',
  cursor_blink: true,
  scrollback: 5000,
  color_scheme: 'nexvigilant_dark',
};

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 32;

/** Tier-based pane limits. */
const MAX_PANES: Record<string, number> = {
  explorer: 1,
  academic: 1,
  accelerator: 2,
  enterprise: 5,
};

// ── Focus navigation helper ──────────────────────────────

/**
 * Find the adjacent pane in a given direction.
 * For simplicity: left/up = previous in tree order, right/down = next.
 */
function findAdjacentPane(
  root: LayoutNode,
  currentId: string,
  direction: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown',
): string | undefined {
  const leaves = collectLeaves(root);
  if (leaves.length <= 1) return undefined;

  const idx = leaves.findIndex((l) => l.id === currentId);
  if (idx === -1) return undefined;

  const delta = direction === 'ArrowLeft' || direction === 'ArrowUp' ? -1 : 1;
  const next = idx + delta;
  if (next < 0 || next >= leaves.length) return undefined;
  return leaves[next]?.id;
}

// ── Props ────────────────────────────────────────────────

interface TerminalClientProps {
  /** Connection params — tenant, user, mode, tier. */
  params?: TerminalConnectParams;
  /** Initial terminal mode. */
  initialMode?: TerminalMode;
  /** CSS class for the container. */
  className?: string;
}

// ── Outer wrapper (provides LayoutProvider) ──────────────

export function TerminalClient({
  params = {},
  initialMode = 'shell',
  className = '',
}: TerminalClientProps) {
  return (
    <LayoutProvider initialMode={initialMode}>
      <TerminalContainerContent
        params={params}
        initialMode={initialMode}
        className={className}
      />
    </LayoutProvider>
  );
}

// ── Inner content (consumes layout context) ─────────────

function TerminalContainerContent({
  params = {},
  initialMode = 'shell',
  className = '',
}: TerminalClientProps) {
  const { layout, dispatch } = useTerminalLayout();
  const [prefs, setPrefs] = useState<TerminalPreferences>(DEFAULT_PREFS);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const [keybindings, setKeybindings] = useState<KeybindingSet>(DEFAULT_KEYBINDINGS);
  const { resolve } = useKeybindings(keybindings);
  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;

  // Refs for values needed in the keydown effect without causing re-subscriptions
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // Store the focused pane's sendUpdatePreference for font zoom
  const sendPreferenceRef = useRef<((key: string, value: unknown) => void) | null>(null);

  // Layout persistence: send UpdateLayout when client mutates layout
  const sendUpdateLayoutRef = useRef<((layout: TerminalLayout) => void) | null>(null);
  const skipPersistRef = useRef(false);
  const sendUpdateKeybindingsRef = useRef<((bindings: KeybindingSet) => void) | null>(null);
  const isInitialRef = useRef(true);

  const connectParams: TerminalConnectParams = {
    mode: initialMode,
    ...params,
  };

  const tierLimit = MAX_PANES[connectParams.tier ?? ''] ?? 1;

  // ── Callbacks for TerminalSplitView → TerminalPane ─────

  const handlePreferencesReceived = useCallback((p: TerminalPreferences) => {
    log.info('Received preferences snapshot');
    setPrefs(p);
  }, []);

  const handlePreferenceUpdated = useCallback((key: string, value: unknown) => {
    log.info(`Preference updated: ${key}`);
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSessionCreated = useCallback((paneId: string, sessionId: string) => {
    dispatch({ type: 'SET_SESSION', paneId, sessionId });
  }, [dispatch]);

  const handleModeChange = useCallback((_paneId: string, _mode: TerminalMode) => {
    // Mode tracked per-pane in layout tree — no container state needed yet
  }, []);

  const handleFocus = useCallback((paneId: string) => {
    dispatch({ type: 'FOCUS_PANE', paneId });
  }, [dispatch]);

  const handleRegisterSendPreference = useCallback((paneId: string, fn: (key: string, value: unknown) => void) => {
    // Only store the focused pane's sender
    if (paneId === layoutRef.current.focused_pane) {
      sendPreferenceRef.current = fn;
    }
  }, []);

  const handleLayout = useCallback((serverLayout: TerminalLayout) => {
    log.info('Received layout from server');
    skipPersistRef.current = true;
    dispatch({ type: 'SET_LAYOUT', layout: serverLayout });
  }, [dispatch]);

  const handleRegisterSendLayout = useCallback((paneId: string, fn: (layout: TerminalLayout) => void) => {
    // Store any connected pane's sender (all pane WS connections can send layout updates)
    if (paneId === layoutRef.current.focused_pane) {
      sendUpdateLayoutRef.current = fn;
    }
  }, []);

  const handleKeybindings = useCallback((bindings: KeybindingSet) => {
    log.info('Received keybindings snapshot');
    setKeybindings(bindings);
  }, []);

  const handleRegisterSendKeybindings = useCallback((paneId: string, fn: (bindings: KeybindingSet) => void) => {
    if (paneId === layoutRef.current.focused_pane) {
      sendUpdateKeybindingsRef.current = fn;
    }
  }, []);

  // ── WS context for TerminalPane consumption ────────────

  const wsContextValue = useMemo<TerminalWsContextValue>(() => ({
    registerSendPreference: handleRegisterSendPreference,
    registerSendLayout: handleRegisterSendLayout,
    registerSendKeybindings: handleRegisterSendKeybindings,
    onPreferencesReceived: handlePreferencesReceived,
    onPreferenceUpdated: handlePreferenceUpdated,
    onLayout: handleLayout,
    onKeybindings: handleKeybindings,
  }), [
    handleRegisterSendPreference,
    handleRegisterSendLayout,
    handleRegisterSendKeybindings,
    handlePreferencesReceived,
    handlePreferenceUpdated,
    handleLayout,
    handleKeybindings,
  ]);

  // ── Layout persistence ─────────────────────────────────
  // Send layout to server after client-initiated mutations (split, close, resize, focus).
  // Skips initial render and server-initiated SET_LAYOUT to avoid echo loops.

  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      return;
    }
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    sendUpdateLayoutRef.current?.(layout);
  }, [layout]);

  // ── Global keyboard shortcuts (via keybinding resolver) ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = resolveRef.current(e, 'global');
      if (!action) return;
      e.preventDefault();
      switch (action) {
        case 'font_increase':
        case 'font_decrease': {
          const current = prefsRef.current;
          const target = action === 'font_increase'
            ? Math.min(MAX_FONT_SIZE, current.font_size + 1)
            : Math.max(MIN_FONT_SIZE, current.font_size - 1);
          if (target !== current.font_size) {
            setPrefs((prev) => ({ ...prev, font_size: target }));
            sendPreferenceRef.current?.('font_size', target);
          }
          break;
        }
        case 'font_reset': {
          const current = prefsRef.current;
          if (current.font_size !== DEFAULT_PREFS.font_size) {
            setPrefs((prev) => ({ ...prev, font_size: DEFAULT_PREFS.font_size }));
            sendPreferenceRef.current?.('font_size', DEFAULT_PREFS.font_size);
          }
          break;
        }
        case 'split_vertical':
          dispatch({ type: 'SPLIT_PANE', paneId: layoutRef.current.focused_pane, direction: 'vertical', maxPanes: tierLimit });
          break;
        case 'split_horizontal':
          dispatch({ type: 'SPLIT_PANE', paneId: layoutRef.current.focused_pane, direction: 'horizontal', maxPanes: tierLimit });
          break;
        case 'close_pane':
          dispatch({ type: 'CLOSE_PANE', paneId: layoutRef.current.focused_pane });
          break;
        case 'focus_left':
        case 'focus_right':
        case 'focus_up':
        case 'focus_down': {
          const dirMap: Record<string, 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'> = {
            focus_left: 'ArrowLeft', focus_right: 'ArrowRight',
            focus_up: 'ArrowUp', focus_down: 'ArrowDown',
          };
          const dir = dirMap[action];
          if (dir) {
            const adj = findAdjacentPane(layoutRef.current.root, layoutRef.current.focused_pane, dir);
            if (adj) dispatch({ type: 'FOCUS_PANE', paneId: adj });
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, tierLimit]);

  // ── Render ─────────────────────────────────────────────

  return (
    <div className={`flex flex-col ${className}`}>
      <TerminalWsContext.Provider value={wsContextValue}>
        <TerminalSplitView
          node={layout.root}
          prefs={prefs}
          connectParams={connectParams}
          focusedPaneId={layout.focused_pane}
          onPaneFocus={handleFocus}
          onSessionCreated={handleSessionCreated}
          onModeChange={handleModeChange}
        />
      </TerminalWsContext.Provider>
    </div>
  );
}
