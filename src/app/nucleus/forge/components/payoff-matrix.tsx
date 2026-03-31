'use client';

import { Dices } from 'lucide-react';

export interface PayoffEntry {
  playerAction: string;
  enemyAction: string;
  playerPayoff: number;
  enemyPayoff: number;
}

export function PayoffMatrix({ entries, nashEquilibrium }: {
  entries: PayoffEntry[];
  nashEquilibrium?: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
        <div className="py-6 text-center text-slate-dim/30 text-[10px] font-mono uppercase tracking-widest">
          Engage hostile to compute payoff matrix
        </div>
      </div>
    );
  }

  const playerActions = [...new Set(entries.map(e => e.playerAction))];
  const enemyActions = [...new Set(entries.map(e => e.enemyAction))];

  const getEntry = (pa: string, ea: string) =>
    entries.find(e => e.playerAction === pa && e.enemyAction === ea);

  return (
    <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-nex-light/20">
        <Dices className="h-3.5 w-3.5 text-gold/60" />
        <span className="intel-label">Payoff Matrix</span>
        <div className="h-px flex-1 bg-nex-light/20" />
      </div>
      <div className="p-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr>
                <th className="text-left py-1.5 text-[9px] font-mono uppercase tracking-widest text-slate-dim/30 font-normal" />
                {enemyActions.map(ea => (
                  <th key={ea} className="text-center py-1.5 text-red-400/60 font-medium px-2 text-[10px]">{ea}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {playerActions.map(pa => (
                <tr key={pa} className="border-t border-nex-light/10">
                  <td className="py-1.5 text-cyan/60 font-medium pr-2 text-[10px]">{pa}</td>
                  {enemyActions.map(ea => {
                    const entry = getEntry(pa, ea);
                    if (!entry) return <td key={ea} className="text-center text-slate-dim/20">—</td>;
                    return (
                      <td key={ea} className="text-center py-1.5 px-2 tabular-nums">
                        <span className={entry.playerPayoff >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}>
                          {entry.playerPayoff > 0 ? '+' : ''}{entry.playerPayoff}
                        </span>
                        <span className="text-slate-dim/20">/</span>
                        <span className={entry.enemyPayoff >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}>
                          {entry.enemyPayoff > 0 ? '+' : ''}{entry.enemyPayoff}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {nashEquilibrium && (
          <div className="mt-2 pt-2 border-t border-nex-light/10">
            <span className="text-[8px] font-mono uppercase tracking-widest text-gold/40">
              Nash Equilibrium:
            </span>
            <span className="text-[10px] font-mono text-gold/60 ml-2">{nashEquilibrium}</span>
          </div>
        )}
      </div>
    </div>
  );
}
