/**
 * Terminal wire protocol types — mirrors Rust nexcore-terminal/src/protocol.rs exactly.
 *
 * All types use snake_case to match serde(rename_all = "snake_case") on the server.
 * The discriminant field is "type" matching serde(tag = "type").
 */

import type { KeybindingSet } from './terminal-keybindings';
import type { TerminalLayout } from './terminal-layout';

// ── Terminal Modes & Status ─────────────────────────────

/** Terminal operating mode — determines how input is routed. */
export type TerminalMode = 'shell' | 'regulatory' | 'ai' | 'hybrid';

/** Terminal session lifecycle status. */
export type SessionStatus = 'creating' | 'active' | 'idle' | 'suspended' | 'terminated';

// ── Terminal Preferences ──────────────────────────────

/** User terminal preferences — mirrors Rust TerminalPreferences struct. */
export interface TerminalPreferences {
  font_size: number;
  font_family: string;
  line_height: number;
  cursor_style: 'block' | 'underline' | 'bar';
  cursor_blink: boolean;
  scrollback: number;
  color_scheme: string;
}

// ── Client → Server Messages ────────────────────────────

/** Raw terminal input (keystrokes). */
export interface WsInputMessage {
  type: 'input';
  data: string;
}

/** Structured command (MCP or AI prefix detected client-side). */
export interface WsCommandMessage {
  type: 'command';
  command: string;
}

/** Terminal resize event. */
export interface WsResizeMessage {
  type: 'resize';
  cols: number;
  rows: number;
}

/** Mode switch request. */
export interface WsModeSwitchMessage {
  type: 'mode_switch';
  mode: TerminalMode;
}

/** Heartbeat ping. */
export interface WsPingMessage {
  type: 'ping';
}

/** Request current user preferences. */
export interface WsGetPreferencesMessage {
  type: 'get_preferences';
}

/** Update a single preference field by key. */
export interface WsUpdatePreferenceMessage {
  type: 'update_preference';
  key: string;
  value: unknown;
}

/** Request current layout from server. */
export interface WsGetLayoutMessage {
  type: 'get_layout';
}

/** Send updated layout to server for persistence. */
export interface WsUpdateLayoutMessage {
  type: 'update_layout';
  layout: TerminalLayout;
}

/** Request current keybindings from server. */
export interface WsGetKeybindingsMessage {
  type: 'get_keybindings';
}

/** Send updated keybinding set to server for persistence. */
export interface WsUpdateKeybindingsMessage {
  type: 'update_keybindings';
  bindings: KeybindingSet;
}

/** Union of all client → server messages. */
export type WsClientMessage =
  | WsInputMessage
  | WsCommandMessage
  | WsResizeMessage
  | WsModeSwitchMessage
  | WsPingMessage
  | WsGetPreferencesMessage
  | WsUpdatePreferenceMessage
  | WsGetLayoutMessage
  | WsUpdateLayoutMessage
  | WsGetKeybindingsMessage
  | WsUpdateKeybindingsMessage;

// ── Server → Client Messages ────────────────────────────

/** Session status payload. */
export interface SessionStatusMsg {
  status: SessionStatus;
  message: string;
  session_id: string;
  mode: TerminalMode;
}

/** Terminal output (raw bytes from PTY or formatted text). */
export interface WsOutputMessage {
  type: 'output';
  data: string;
}

/** Structured result from MCP tool or AI query. */
export interface WsResultMessage {
  type: 'result';
  source: string;
  content: unknown;
}

/** Streaming AI token. */
export interface WsAiTokenMessage {
  type: 'ai_token';
  token: string;
  done: boolean;
}

/** Session status change notification. */
export interface WsStatusMessage {
  type: 'status';
  session: SessionStatusMsg;
}

/** Error notification. */
export interface WsErrorMessage {
  type: 'error';
  code: string;
  message: string;
}

/** Heartbeat response. */
export interface WsPongMessage {
  type: 'pong';
}

/** Full preferences snapshot (sent on connect and on request). */
export interface WsPreferencesMessage {
  type: 'preferences';
  preferences: TerminalPreferences;
}

/** Confirmation that a single preference was updated. */
export interface WsPreferenceUpdatedMessage {
  type: 'preference_updated';
  key: string;
  value: unknown;
}

/** Layout snapshot (sent on connect, on request, and after update). */
export interface WsLayoutMessage {
  type: 'layout';
  layout: TerminalLayout;
}

/** Keybindings snapshot (sent on connect, on request, and after update). */
export interface WsKeybindingsMessage {
  type: 'keybindings';
  bindings: KeybindingSet;
}

/** Union of all server → client messages. */
export type WsServerMessage =
  | WsOutputMessage
  | WsResultMessage
  | WsAiTokenMessage
  | WsStatusMessage
  | WsErrorMessage
  | WsPongMessage
  | WsPreferencesMessage
  | WsPreferenceUpdatedMessage
  | WsLayoutMessage
  | WsKeybindingsMessage;

// ── Connection Config ───────────────────────────────────

/** Parameters for establishing a terminal WebSocket connection. */
export interface TerminalConnectParams {
  tenantId?: string;
  userId?: string;
  mode?: TerminalMode;
  tier?: string;
}

/** Terminal connection state. */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
