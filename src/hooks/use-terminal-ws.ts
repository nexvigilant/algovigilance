'use client';

/**
 * useTerminalWs — WebSocket hook for the AlgoVigilance terminal.
 *
 * Manages connection lifecycle, reconnection, heartbeat, and message dispatch.
 * Connects directly to nexcore-api WebSocket endpoint (no HTTP proxy for WS).
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import type {
  WsClientMessage,
  WsServerMessage,
  TerminalConnectParams,
  ConnectionStatus,
  TerminalMode,
  TerminalPreferences,
} from '@/types/terminal';
import type { KeybindingSet } from '@/types/terminal-keybindings';
import type { TerminalLayout } from '@/types/terminal-layout';

const log = logger.scope('terminal-ws');

/** Derive WebSocket URL from the nexcore API URL. */
function getWsUrl(params: TerminalConnectParams): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_NEXCORE_API_URL || 'http://localhost:3030';

  // Convert http(s) to ws(s)
  const wsBase = baseUrl.replace(/^http/, 'ws');

  const searchParams = new URLSearchParams();
  if (params.tenantId) searchParams.set('tenant_id', params.tenantId);
  if (params.userId) searchParams.set('user_id', params.userId);
  if (params.mode) searchParams.set('mode', params.mode);
  if (params.tier) searchParams.set('tier', params.tier);

  const qs = searchParams.toString();
  return `${wsBase}/api/v1/terminal/ws${qs ? `?${qs}` : ''}`;
}

const HEARTBEAT_INTERVAL_MS = 25_000;
const RECONNECT_BASE_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 10;

interface UseTerminalWsOptions {
  /** Connection params sent as query string. */
  params: TerminalConnectParams;
  /** Called when server sends terminal output. */
  onOutput?: (data: string) => void;
  /** Called when server sends a structured result. */
  onResult?: (source: string, content: unknown) => void;
  /** Called when server sends an AI streaming token. */
  onAiToken?: (token: string, done: boolean) => void;
  /** Called on session status change. */
  onStatus?: (status: WsServerMessage & { type: 'status' }) => void;
  /** Called on server error. */
  onError?: (code: string, message: string) => void;
  /** Called when server sends full preferences snapshot. */
  onPreferences?: (prefs: TerminalPreferences) => void;
  /** Called when server confirms a single preference update. */
  onPreferenceUpdated?: (key: string, value: unknown) => void;
  /** Called when server sends a layout snapshot (on connect and after updates). */
  onLayout?: (layout: TerminalLayout) => void;
  /** Called when server sends a keybindings snapshot (on connect and after updates). */
  onKeybindings?: (bindings: KeybindingSet) => void;
  /** Auto-connect on mount (default true). */
  autoConnect?: boolean;
}

interface UseTerminalWsReturn {
  /** Current connection status. */
  status: ConnectionStatus;
  /** Current terminal mode (from last status message). */
  mode: TerminalMode;
  /** Session ID (from server, after connection). */
  sessionId: string | null;
  /** Send raw input to the terminal. */
  sendInput: (data: string) => void;
  /** Send a structured command. */
  sendCommand: (command: string) => void;
  /** Send a resize event. */
  sendResize: (cols: number, rows: number) => void;
  /** Request mode switch. */
  switchMode: (mode: TerminalMode) => void;
  /** Manually connect. */
  connect: () => void;
  /** Send a preference update request. */
  sendUpdatePreference: (key: string, value: unknown) => void;
  /** Request full preferences snapshot from server. */
  sendGetPreferences: () => void;
  /** Send a layout update to server for persistence. */
  sendUpdateLayout: (layout: TerminalLayout) => void;
  /** Request layout snapshot from server. */
  sendGetLayout: () => void;
  /** Send a keybindings update to server for persistence. */
  sendUpdateKeybindings: (bindings: KeybindingSet) => void;
  /** Request keybindings snapshot from server. */
  sendGetKeybindings: () => void;
  /** Manually disconnect (no auto-reconnect). */
  disconnect: () => void;
}

export function useTerminalWs(options: UseTerminalWsOptions): UseTerminalWsReturn {
  const { params, autoConnect = true } = options;

  // Store callbacks in refs to avoid effect re-runs
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalCloseRef = useRef(false);

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [mode, setMode] = useState<TerminalMode>(params.mode ?? 'shell');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const send = useCallback((msg: WsClientMessage) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      send({ type: 'ping' });
    }, HEARTBEAT_INTERVAL_MS);
  }, [clearHeartbeat, send]);

  const handleMessage = useCallback((event: MessageEvent) => {
    const cbs = callbacksRef.current;
    try {
      const msg = JSON.parse(event.data as string) as WsServerMessage;
      switch (msg.type) {
        case 'output':
          cbs.onOutput?.(msg.data);
          break;
        case 'result':
          cbs.onResult?.(msg.source, msg.content);
          break;
        case 'ai_token':
          cbs.onAiToken?.(msg.token, msg.done);
          break;
        case 'status':
          setMode(msg.session.mode);
          setSessionId(msg.session.session_id);
          cbs.onStatus?.(msg);
          break;
        case 'error':
          cbs.onError?.(msg.code, msg.message);
          break;
        case 'preferences':
          cbs.onPreferences?.(msg.preferences);
          break;
        case 'preference_updated':
          cbs.onPreferenceUpdated?.(msg.key, msg.value);
          break;
        case 'layout':
          cbs.onLayout?.(msg.layout);
          break;
        case 'keybindings':
          cbs.onKeybindings?.(msg.bindings);
          break;
        case 'pong':
          // Heartbeat acknowledged
          break;
        default:
          log.debug('Unknown server message type:', msg);
      }
    } catch {
      log.warn('Failed to parse WS message:', event.data);
    }
  }, []);

  const connect = useCallback(() => {
    // Cleanup existing connection
    if (wsRef.current) {
      intentionalCloseRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }

    clearHeartbeat();
    clearReconnectTimer();
    intentionalCloseRef.current = false;
    setStatus('connecting');

    const url = getWsUrl(params);
    log.info('Connecting to terminal WS:', url);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      log.info('Terminal WS connected');
      setStatus('connected');
      reconnectAttemptRef.current = 0;
      startHeartbeat();
    };

    ws.onmessage = handleMessage;

    ws.onclose = (event) => {
      log.info(`Terminal WS closed: ${event.code} ${event.reason}`);
      clearHeartbeat();
      wsRef.current = null;

      if (intentionalCloseRef.current) {
        setStatus('disconnected');
        return;
      }

      // Auto-reconnect with exponential backoff
      if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
        setStatus('reconnecting');
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttemptRef.current),
          MAX_RECONNECT_DELAY_MS,
        );
        reconnectAttemptRef.current++;
        log.info(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`);
        reconnectTimerRef.current = setTimeout(connect, delay);
      } else {
        setStatus('error');
        log.warn('Max reconnect attempts reached');
      }
    };

    ws.onerror = () => {
      log.warn('Terminal WS error');
      // onclose will fire after onerror — reconnect handled there
    };
  }, [params, clearHeartbeat, clearReconnectTimer, startHeartbeat, handleMessage]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    clearHeartbeat();
    clearReconnectTimer();
    reconnectAttemptRef.current = 0;

    if (wsRef.current) {
      wsRef.current.close(1000, 'client disconnect');
      wsRef.current = null;
    }

    setStatus('disconnected');
    setSessionId(null);
  }, [clearHeartbeat, clearReconnectTimer]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      intentionalCloseRef.current = true;
      clearHeartbeat();
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close(1000, 'component unmount');
        wsRef.current = null;
      }
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    mode,
    sessionId,
    sendInput: useCallback((data: string) => send({ type: 'input', data }), [send]),
    sendCommand: useCallback((command: string) => send({ type: 'command', command }), [send]),
    sendResize: useCallback((cols: number, rows: number) => send({ type: 'resize', cols, rows }), [send]),
    switchMode: useCallback((m: TerminalMode) => send({ type: 'mode_switch', mode: m }), [send]),
    sendUpdatePreference: useCallback((key: string, value: unknown) => send({ type: 'update_preference', key, value }), [send]),
    sendGetPreferences: useCallback(() => send({ type: 'get_preferences' }), [send]),
    sendUpdateLayout: useCallback((layout: TerminalLayout) => send({ type: 'update_layout', layout }), [send]),
    sendGetLayout: useCallback(() => send({ type: 'get_layout' }), [send]),
    sendUpdateKeybindings: useCallback((bindings: KeybindingSet) => send({ type: 'update_keybindings', bindings }), [send]),
    sendGetKeybindings: useCallback(() => send({ type: 'get_keybindings' }), [send]),
    connect,
    disconnect,
  };
}
