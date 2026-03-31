import { LAYER_CONFIG, type CrateLayer } from '@/types/crate-registry';

interface LayerBadgeProps {
  layer: CrateLayer;
  size?: 'sm' | 'md';
}

export function LayerBadge({ layer, size = 'sm' }: LayerBadgeProps) {
  const config = LAYER_CONFIG[layer];

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[9px]'
    : 'px-2.5 py-1 text-[10px]';

  return (
    <span
      className={`inline-flex items-center border font-bold font-mono uppercase tracking-widest ${sizeClasses} ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      {config.label}
    </span>
  );
}
