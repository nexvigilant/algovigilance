'use client';

/**
 * useKeybindings — O(1) combo-to-action resolver for terminal keybindings.
 *
 * Builds a Map<string, Keybinding> from a KeybindingSet on change,
 * then exposes a resolve(event, scope) function for instant lookup.
 */

import { useMemo, useCallback } from 'react';
import type {
  KeybindingSet,
  KeybindingAction,
  KeybindingScope,
  Keybinding,
} from '@/types/terminal-keybindings';
import { comboKey, eventToCombo } from '@/types/terminal-keybindings';

interface UseKeybindingsReturn {
  /** Resolve a KeyboardEvent to an action, or null if no match in scope. */
  resolve: (event: KeyboardEvent, scope: KeybindingScope) => KeybindingAction | null;
}

export function useKeybindings(set: KeybindingSet): UseKeybindingsReturn {
  const lookupMap = useMemo(() => {
    const map = new Map<string, Keybinding>();
    for (const binding of set.bindings) {
      if (binding.enabled) {
        const key = comboKey(binding.combo);
        // First enabled binding wins (matches Rust find_by_combo)
        if (!map.has(key)) {
          map.set(key, binding);
        }
      }
    }
    return map;
  }, [set]);

  const resolve = useCallback(
    (event: KeyboardEvent, scope: KeybindingScope): KeybindingAction | null => {
      const combo = eventToCombo(event);
      const key = comboKey(combo);
      const binding = lookupMap.get(key);
      if (binding && binding.scope === scope) {
        return binding.action;
      }
      return null;
    },
    [lookupMap],
  );

  return { resolve };
}
