/** Terminal keybinding types — mirrors Rust nexcore-terminal/src/keybindings.rs. */

/** Modifier keys held during a key combo. */
export interface KeyModifiers {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

/** A normalized key combination (modifiers + lowercase key). */
export interface KeyCombo {
  modifiers: KeyModifiers;
  key: string;
}

/** Terminal actions that can be bound to key combos. */
export type KeybindingAction =
  | 'font_increase'
  | 'font_decrease'
  | 'font_reset'
  | 'split_vertical'
  | 'split_horizontal'
  | 'close_pane'
  | 'focus_left'
  | 'focus_right'
  | 'focus_up'
  | 'focus_down'
  | 'cycle_mode'
  | 'open_search'
  | 'close_search';

/** Where a keybinding is evaluated. */
export type KeybindingScope = 'global' | 'pane';

/** A single keybinding: combo → action at a given scope. */
export interface Keybinding {
  combo: KeyCombo;
  action: KeybindingAction;
  scope: KeybindingScope;
  enabled: boolean;
}

/** Complete set of keybindings for one user. */
export interface KeybindingSet {
  bindings: Keybinding[];
}

/** Serialize a KeyCombo to a deterministic string key for Map lookup. */
export function comboKey(combo: KeyCombo): string {
  const parts: string[] = [];
  if (combo.modifiers.ctrl) parts.push('ctrl');
  if (combo.modifiers.shift) parts.push('shift');
  if (combo.modifiers.alt) parts.push('alt');
  if (combo.modifiers.meta) parts.push('meta');
  parts.push(combo.key);
  return parts.join('+');
}

/** Extract a KeyCombo from a KeyboardEvent, normalizing key (lowercase, '+' → '='). */
export function eventToCombo(e: KeyboardEvent): KeyCombo {
  let key = e.key.toLowerCase();
  if (key === '+') key = '=';
  return {
    modifiers: {
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
    },
    key,
  };
}

function ctrl(): KeyModifiers { return { ctrl: true, shift: false, alt: false, meta: false }; }
function ctrlShift(): KeyModifiers { return { ctrl: true, shift: true, alt: false, meta: false }; }
function none(): KeyModifiers { return { ctrl: false, shift: false, alt: false, meta: false }; }

function bind(modifiers: KeyModifiers, key: string, action: KeybindingAction, scope: KeybindingScope): Keybinding {
  return { combo: { modifiers, key }, action, scope, enabled: true };
}

/** The 13 default keybindings matching Rust KeybindingSet::default_set(). */
export const DEFAULT_KEYBINDINGS: KeybindingSet = {
  bindings: [
    // Global — font zoom
    bind(ctrl(), '=', 'font_increase', 'global'),
    bind(ctrl(), '-', 'font_decrease', 'global'),
    bind(ctrl(), '0', 'font_reset', 'global'),
    // Global — split / close
    bind(ctrlShift(), 'd', 'split_vertical', 'global'),
    bind(ctrlShift(), 'e', 'split_horizontal', 'global'),
    bind(ctrlShift(), 'w', 'close_pane', 'global'),
    // Global — focus navigation
    bind(ctrlShift(), 'arrowleft', 'focus_left', 'global'),
    bind(ctrlShift(), 'arrowright', 'focus_right', 'global'),
    bind(ctrlShift(), 'arrowup', 'focus_up', 'global'),
    bind(ctrlShift(), 'arrowdown', 'focus_down', 'global'),
    // Pane — mode & search
    bind(ctrlShift(), 'm', 'cycle_mode', 'pane'),
    bind(ctrl(), 'f', 'open_search', 'pane'),
    bind(none(), 'escape', 'close_search', 'pane'),
  ],
};
