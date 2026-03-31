import type { Metadata } from 'next';
import { TerminalLoader } from './components/terminal-loader';

export const metadata: Metadata = {
  title: 'Terminal | Nucleus',
  description: 'Multi-modal terminal — Shell, Regulatory Intelligence, and AI modes.',
};

export default function TerminalPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold text-white">Terminal</h1>
          <p className="text-xs text-slate-500">
            Strategic Vigilance Intelligence Terminal
          </p>
        </div>
      </div>
      <TerminalLoader className="flex-1 min-h-0" />
    </div>
  );
}
