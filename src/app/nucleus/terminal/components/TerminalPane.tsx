'use client';

/**
 * TerminalPane — a single terminal pane with its own xterm.js instance and WebSocket.
 *
 * Owns: xterm lifecycle, WS connection, search overlay, mode cycling, status bar.
 * Receives: preferences as prop (applied via useEffect), focus state from container.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';
import { useTerminalWs } from '@/hooks/use-terminal-ws';
import { logger } from '@/lib/logger';
import type {
  TerminalMode,
  ConnectionStatus,
  TerminalConnectParams,
  TerminalPreferences,
  SessionStatusMsg,
} from '@/types/terminal';
import type { TerminalLayout } from '@/types/terminal-layout';
import type { KeybindingSet } from '@/types/terminal-keybindings';
import { useKeybindings } from '@/hooks/use-keybindings';
import { useTerminalWsContext } from './terminal-ws-context';
import { DEFAULT_KEYBINDINGS } from '@/types/terminal-keybindings';
import { THEMES } from './terminal-themes';

const log = logger.scope('terminal-pane');

// ── Display constants ───────────────────────────────────

const MODE_COLORS: Record<TerminalMode, string> = {
  shell: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  regulatory: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  ai: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  hybrid: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  disconnected: 'bg-slate-500/20 text-slate-400',
  connecting: 'bg-amber-500/20 text-amber-400',
  connected: 'bg-emerald-500/20 text-emerald-400',
  reconnecting: 'bg-amber-500/20 text-amber-400',
  error: 'bg-red-500/20 text-red-400',
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  error: 'Connection Failed',
};

// ── Props ────────────────────────────────────────────────

export interface TerminalPaneProps {
  paneId: string;
  mode: TerminalMode;
  prefs: TerminalPreferences;
  connectParams: TerminalConnectParams;
  isFocused: boolean;
  onFocus: () => void;
  onSessionCreated: (sessionId: string) => void;
  onModeChange: (mode: TerminalMode) => void;
}

// ── Component ────────────────────────────────────────────

export function TerminalPane({
  paneId,
  mode: initialMode,
  prefs,
  connectParams,
  isFocused,
  onFocus,
  onSessionCreated,
  onModeChange,
}: TerminalPaneProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stable ref for parent callbacks (avoids stale closures in effects)
  const parentRef = useRef({ onFocus, onSessionCreated, onModeChange });
  parentRef.current = { onFocus, onSessionCreated, onModeChange };

  // WS callbacks via context (ref avoids stale closures in WS handlers)
  const wsCtx = useTerminalWsContext();
  const wsCtxRef = useRef(wsCtx);
  wsCtxRef.current = wsCtx;

  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;

  const [keybindings, setKeybindings] = useState<KeybindingSet>(DEFAULT_KEYBINDINGS);
  const { resolve } = useKeybindings(keybindings);

  // ── WebSocket connection ───────────────────────────────

  const {
    status,
    mode,
    sessionId,
    sendInput,
    sendCommand: _sendCommand,
    sendResize,
    switchMode,
    sendUpdatePreference,
    sendUpdateLayout,
    sendUpdateKeybindings,
    connect,
    disconnect,
  } = useTerminalWs({
    params: { mode: initialMode, ...connectParams },
    onOutput: useCallback((data: string) => {
      xtermRef.current?.write(data);
    }, []),
    onResult: useCallback((source: string, content: unknown) => {
      const term = xtermRef.current;
      if (!term) return;
      term.write(`\r\n\x1b[36m[${source}]\x1b[0m `);
      const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      term.write(text.replace(/\n/g, '\r\n'));
      term.write('\r\n');
    }, []),
    onAiToken: useCallback((token: string, done: boolean) => {
      const term = xtermRef.current;
      if (!term) return;
      term.write(token);
      if (done) term.write('\r\n');
    }, []),
    onStatus: useCallback((msg: { type: 'status'; session: SessionStatusMsg }) => {
      const term = xtermRef.current;
      if (!term) return;
      const s = msg.session;
      log.info(`Session status: ${s.status} — ${s.message}`);
      if (s.status === 'active') {
        term.write(`\x1b[32m[${s.mode}]\x1b[0m Session ${s.session_id.slice(0, 8)}... ready\r\n`);
        parentRef.current.onSessionCreated(s.session_id);
      }
      parentRef.current.onModeChange(s.mode);
    }, []),
    onError: useCallback((code: string, message: string) => {
      const term = xtermRef.current;
      if (!term) return;
      term.write(`\r\n\x1b[31m[ERROR: ${code}]\x1b[0m ${message}\r\n`);
    }, []),
    onPreferences: useCallback((p: TerminalPreferences) => {
      log.info('Received preferences snapshot');
      wsCtxRef.current.onPreferencesReceived(p);
    }, []),
    onPreferenceUpdated: useCallback((key: string, value: unknown) => {
      log.info(`Preference updated: ${key}`);
      wsCtxRef.current.onPreferenceUpdated(key, value);
    }, []),
    onLayout: useCallback((layout: TerminalLayout) => {
      log.info('Received layout snapshot');
      wsCtxRef.current.onLayout(layout);
    }, []),
    onKeybindings: useCallback((bindings: KeybindingSet) => {
      log.info('Received keybindings snapshot');
      setKeybindings(bindings);
      wsCtxRef.current.onKeybindings(bindings);
    }, []),
    autoConnect: false,
  });

  // Register sendUpdatePreference for container's font zoom
  useEffect(() => {
    wsCtxRef.current.registerSendPreference(paneId, sendUpdatePreference);
  }, [paneId, sendUpdatePreference]);

  // Register sendUpdateLayout for container's layout persistence
  useEffect(() => {
    wsCtxRef.current.registerSendLayout(paneId, sendUpdateLayout);
  }, [paneId, sendUpdateLayout]);

  // Register sendUpdateKeybindings for container
  useEffect(() => {
    wsCtxRef.current.registerSendKeybindings(paneId, sendUpdateKeybindings);
  }, [paneId, sendUpdateKeybindings]);

  // ── xterm.js lifecycle ─────────────────────────────────

  useEffect(() => {
    const container = terminalRef.current;
    if (!container) return;

    const p = prefsRef.current;
    const term = new XTerm({
      theme: THEMES[p.color_scheme] ?? THEMES['nexvigilant_dark'],
      fontFamily: p.font_family,
      fontSize: p.font_size,
      lineHeight: p.line_height,
      cursorBlink: p.cursor_blink,
      cursorStyle: p.cursor_style,
      scrollback: p.scrollback,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);
    term.open(container);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    // Welcome banner
    term.write('\x1b[36m');
    term.write('    _   __          _    ___       _ __            __\r\n');
    term.write('   / | / /__  _  _| |  / (_)___ _(_) /___ _____  / /_\r\n');
    term.write('  /  |/ / _ \\| |/_/ | / / / __ `/ / / __ `/ __ \\/ __/\r\n');
    term.write(' / /|  /  __/>  < | |/ / / /_/ / / / /_/ / / / / /_\r\n');
    term.write('/_/ |_/\\___/_/|_| |___/_/\\__, /_/_/\\__,_/_/ /_/\\__/\r\n');
    term.write('                        /____/\r\n');
    term.write('\x1b[0m\r\n');
    term.write('\x1b[90mStrategic Vigilance Intelligence Terminal\x1b[0m\r\n\r\n');

    setIsReady(true);

    term.onData((data) => { sendInput(data); });

    const handleResize = () => {
      fitAddon.fit();
      sendResize(term.cols, term.rows);
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);

    const handleClick = () => {
      term.focus();
      parentRef.current.onFocus();
    };
    container.addEventListener('click', handleClick);

    return () => {
      observer.disconnect();
      container.removeEventListener('click', handleClick);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      searchAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect WS after xterm is ready
  useEffect(() => {
    if (isReady) connect();
    return () => { disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // Apply preferences when prop changes
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;
    term.options.fontSize = prefs.font_size;
    term.options.fontFamily = prefs.font_family;
    term.options.lineHeight = prefs.line_height;
    term.options.cursorStyle = prefs.cursor_style;
    term.options.cursorBlink = prefs.cursor_blink;
    term.options.scrollback = prefs.scrollback;
    term.options.theme = THEMES[prefs.color_scheme] ?? THEMES['nexvigilant_dark'];
    fitAddonRef.current?.fit();
  }, [prefs]);

  // ── Keyboard shortcuts (per-pane, via keybinding resolver) ──

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process pane-scoped keybindings when this pane is focused
      if (!isFocusedRef.current) return;
      const action = resolve(e, 'pane');
      if (!action) return;
      if (action !== 'close_search') e.preventDefault();
      switch (action) {
        case 'cycle_mode': {
          const modes: TerminalMode[] = ['shell', 'regulatory', 'ai', 'hybrid'];
          const currentIdx = modes.indexOf(mode);
          const nextMode = modes[(currentIdx + 1) % modes.length];
          if (nextMode) {
            switchMode(nextMode);
            xtermRef.current?.write(`\r\n\x1b[33m[mode → ${nextMode}]\x1b[0m\r\n`);
          }
          break;
        }
        case 'open_search':
          setSearchOpen(true);
          break;
        case 'close_search':
          if (searchOpen) {
            setSearchOpen(false);
            setSearchQuery('');
            searchAddonRef.current?.clearDecorations();
            xtermRef.current?.focus();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, switchMode, searchOpen, resolve]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // ── Search handlers ────────────────────────────────────

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (value) {
      searchAddonRef.current?.findNext(value, { regex: false, caseSensitive: false });
    } else {
      searchAddonRef.current?.clearDecorations();
    }
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        searchAddonRef.current?.findPrevious(searchQuery, { regex: false, caseSensitive: false });
      } else {
        searchAddonRef.current?.findNext(searchQuery, { regex: false, caseSensitive: false });
      }
    }
  }, [searchQuery]);

  // ── Render ─────────────────────────────────────────────

  const focusRing = isFocused ? 'ring-1 ring-cyan-500/50' : '';

  return (
    <div className={`flex flex-col flex-1 min-h-0 ${focusRing}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1321] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
            {STATUS_LABELS[status]}
          </span>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${MODE_COLORS[mode]}`}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </span>
          {sessionId && (
            <span className="text-xs text-slate-500 font-mono">
              {sessionId.slice(0, 8)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono" title="Font size (Ctrl+/- to adjust, Ctrl+0 to reset)">
            {prefs.font_size}px
          </span>
          <span className="text-xs text-slate-600">
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[10px]">Ctrl</kbd>
            +<kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[10px]">Shift</kbd>
            +<kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[10px]">M</kbd>
            {' '}cycle mode
          </span>
          {(status === 'disconnected' || status === 'error') && (
            <button
              onClick={connect}
              className="rounded border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1a]"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="flex items-center gap-2 border-b border-cyan-500/20 bg-[#0d1321] px-4 py-1.5">
          <svg className="h-4 w-4 shrink-0 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search terminal..."
            className="flex-1 bg-[#1a1e2e] border border-slate-700 rounded px-2 py-1 text-sm text-[#c8d6e5] placeholder-slate-500 outline-none focus:border-cyan-500/50"
            aria-label="Search terminal buffer"
          />
          <button
            onClick={() => searchAddonRef.current?.findPrevious(searchQuery, { regex: false, caseSensitive: false })}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            aria-label="Previous match"
            title="Previous (Shift+Enter)"
          >
            &#x25B2;
          </button>
          <button
            onClick={() => searchAddonRef.current?.findNext(searchQuery, { regex: false, caseSensitive: false })}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            aria-label="Next match"
            title="Next (Enter)"
          >
            &#x25BC;
          </button>
          <button
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
              searchAddonRef.current?.clearDecorations();
              xtermRef.current?.focus();
            }}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            aria-label="Close search"
            title="Close (Escape)"
          >
            &#x2715;
          </button>
        </div>
      )}

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="flex-1 min-h-0"
        role="textbox"
        aria-label="Terminal"
        aria-multiline="true"
        tabIndex={0}
      />
    </div>
  );
}
