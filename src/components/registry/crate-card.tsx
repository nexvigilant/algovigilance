import Link from 'next/link';
import { LayerBadge } from './layer-badge';
import type { CrateLayer } from '@/types/crate-registry';

interface CrateCardProps {
  name: string;
  version?: string;
  description?: string;
  layer?: CrateLayer;
  fanIn?: number;
  fanOut?: number;
  compact?: boolean;
}

export function CrateCard({ name, version, description, layer, fanIn, compact = false }: CrateCardProps) {
  if (compact) {
    return (
      <Link
        href={`/nucleus/tools/registry/${encodeURIComponent(name)}`}
        className="flex items-center gap-2 px-3 py-2 border border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all group"
      >
        <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{name}</span>
        {layer && <LayerBadge layer={layer} size="sm" />}
      </Link>
    );
  }

  return (
    <Link
      href={`/nucleus/tools/registry/${encodeURIComponent(name)}`}
      className="block px-4 py-3 border border-white/[0.06] bg-black/20 hover:border-white/[0.12] hover:bg-white/[0.03] transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 border border-white/[0.08] bg-black/30 flex items-center justify-center text-[10px] font-extrabold text-slate-400/30 font-mono">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{name}</span>
              {version && <span className="text-[10px] text-slate-400/40 font-mono shrink-0">v{version}</span>}
            </div>
            {description && (
              <p className="text-[9px] text-slate-400/40 font-mono mt-0.5 truncate max-w-md">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {layer && <LayerBadge layer={layer} />}
          {fanIn !== undefined && (
            <span className="text-[9px] font-mono text-slate-400/30" title="Used by (fan-in)">
              {fanIn} dep{fanIn !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
