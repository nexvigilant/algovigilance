'use client';

import { Heart, Sword, Shield, Footprints, Layers } from 'lucide-react';

export interface GameStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  floor: number;
  maxFloors: number;
  turn: number;
  primitivesCollected: string[];
}

export function GameHud({ stats }: { stats: GameStats }) {
  const hpPercent = Math.max(0, (stats.hp / stats.maxHp) * 100);

  // Segmented HP bar
  const segments = 20;
  const filled = Math.round((hpPercent / 100) * segments);

  return (
    <div className="border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30">
      {/* Panel Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-nex-light/20">
        <Heart className="h-3.5 w-3.5 text-red-400/60" />
        <span className="intel-label">Player Status</span>
        <div className="h-px flex-1 bg-nex-light/20" />
      </div>

      <div className="p-4 space-y-3">
        {/* Segmented HP Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40">
              Hull Integrity
            </span>
            <span className="text-xs font-mono tabular-nums text-white/80">{stats.hp}/{stats.maxHp}</span>
          </div>
          <div className="flex gap-px">
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 transition-colors ${
                  i < filled
                    ? hpPercent > 60
                      ? 'bg-emerald-400/60'
                      : hpPercent > 30
                        ? 'bg-gold/60'
                        : 'bg-red-400/60'
                    : 'bg-nex-light/15'
                }`}
                style={{ animationDelay: `${i * 25}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <StatReadout icon={<Sword className="h-3 w-3 text-red-400/60" />} label="ATK" value={stats.atk} />
          <StatReadout icon={<Shield className="h-3 w-3 text-cyan/60" />} label="DEF" value={stats.def} />
          <StatReadout icon={<Layers className="h-3 w-3 text-gold/60" />} label="FLR" value={`${stats.floor}/${stats.maxFloors}`} />
          <StatReadout icon={<Footprints className="h-3 w-3 text-slate-dim/40" />} label="TRN" value={stats.turn} />
        </div>

        {/* Primitives Collected */}
        <div>
          <span className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1.5">
            Collected Primitives
          </span>
          <div className="flex flex-wrap gap-1">
            {stats.primitivesCollected.length === 0 ? (
              <span className="text-[10px] font-mono text-slate-dim/30">Awaiting extraction...</span>
            ) : (
              stats.primitivesCollected.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-6 h-6 bg-cyan/8 text-cyan/70 text-sm font-mono border border-cyan/20"
                >
                  {p}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatReadout({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="border border-nex-light/20 bg-nex-surface/20 p-1.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">{icon}</div>
      <div className="text-white font-mono text-sm font-bold tabular-nums">{value}</div>
      <div className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/30">{label}</div>
    </div>
  );
}
