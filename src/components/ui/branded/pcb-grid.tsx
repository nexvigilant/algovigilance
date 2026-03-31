import * as React from 'react';
import { cn } from '@/lib/utils';

interface PCBGridProps extends React.HTMLAttributes<HTMLDivElement> {
  showNodes?: boolean;
  nodeColor?: 'cyan' | 'gold';
}

export function PCBGrid({
  className,
  children,
  showNodes = true,
  nodeColor = 'cyan',
  ...props
}: PCBGridProps) {
  return (
    <div
      className={cn(
        'pcb-grid relative min-h-[200px] w-full overflow-hidden rounded-lg border border-nex-light bg-nex-deep/50',
        className
      )}
      {...props}
    >
      {/* Content */}
      <div className="relative z-10 h-full w-full p-6">{children}</div>

      {/* Decorative Data Nodes */}
      {showNodes && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <div
            className={cn(
              'data-node absolute left-1/4 top-1/4',
              nodeColor === 'cyan' ? 'data-node-cyan' : 'data-node-gold'
            )}
          />
          <div
            className={cn(
              'data-node absolute left-1/3 top-3/4',
              nodeColor === 'cyan' ? 'data-node-cyan' : 'data-node-gold'
            )}
            style={{ animationDelay: '0.5s' }}
          />
          <div
            className={cn(
              'data-node absolute right-1/4 top-1/3',
              nodeColor === 'cyan' ? 'data-node-cyan' : 'data-node-gold'
            )}
            style={{ animationDelay: '1s' }}
          />
          <div
            className={cn(
              'data-node absolute bottom-1/4 right-1/3',
              nodeColor === 'cyan' ? 'data-node-cyan' : 'data-node-gold'
            )}
            style={{ animationDelay: '1.5s' }}
          />
        </div>
      )}
    </div>
  );
}
