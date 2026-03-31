'use client';

/**
 * TerminalLoader — client-side dynamic import wrapper for xterm.js.
 *
 * next/dynamic with ssr:false requires a client component.
 * This keeps page.tsx as a server component (metadata export).
 */

import dynamic from 'next/dynamic';

const TerminalClient = dynamic(
  () => import('./terminal-client').then((m) => m.TerminalClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
          <p className="text-sm text-slate-500">Initializing terminal...</p>
        </div>
      </div>
    ),
  },
);

interface TerminalLoaderProps {
  className?: string;
}

export function TerminalLoader({ className }: TerminalLoaderProps) {
  return <TerminalClient className={className} />;
}
