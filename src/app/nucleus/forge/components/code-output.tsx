'use client';

import { Code2, Lock } from 'lucide-react';

export function CodeOutput({ code }: { code: string }) {
  return (
    <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30 h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-nex-light/20">
        <Code2 className="h-3.5 w-3.5 text-cyan/60" />
        <span className="intel-label">Synthesized Output</span>
        <div className="h-px flex-1 bg-nex-light/20" />
        <Lock className="h-3 w-3 text-slate-dim/20" />
      </div>
      <div className="p-3">
        <pre className="intel-scanlines text-xs font-mono text-slate-300/80 bg-black/40 p-3 overflow-auto max-h-[400px] whitespace-pre-wrap border border-nex-light/10">
          {code || '// Collect primitives to synthesize Rust code...'}
        </pre>
      </div>
    </div>
  );
}
