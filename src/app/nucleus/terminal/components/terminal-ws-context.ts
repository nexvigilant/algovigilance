import { createContext, useContext } from 'react';
import type { TerminalLayout } from '@/types/terminal-layout';
import type { TerminalPreferences } from '@/types/terminal';
import type { KeybindingSet } from '@/types/terminal-keybindings';

export interface TerminalWsContextValue {
  registerSendPreference: (paneId: string, fn: (key: string, value: unknown) => void) => void;
  registerSendLayout: (paneId: string, fn: (layout: TerminalLayout) => void) => void;
  registerSendKeybindings: (paneId: string, fn: (bindings: KeybindingSet) => void) => void;
  onPreferencesReceived: (prefs: TerminalPreferences) => void;
  onPreferenceUpdated: (key: string, value: unknown) => void;
  onLayout: (layout: TerminalLayout) => void;
  onKeybindings: (bindings: KeybindingSet) => void;
}

export const TerminalWsContext = createContext<TerminalWsContextValue | null>(null);

export function useTerminalWsContext(): TerminalWsContextValue {
  const ctx = useContext(TerminalWsContext);
  if (!ctx) {
    throw new Error('useTerminalWsContext must be used within a TerminalWsContext.Provider');
  }
  return ctx;
}
