'use client';

import { STAGE_INFO, type ProgramStage } from '@/lib/actions/programs';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAGE_ORDER, STAGE_COLORS } from './constants';

export function StagePipelineDetailed({ currentStage, onAdvance }: {
  currentStage: ProgramStage;
  onAdvance: (stage: ProgramStage) => void;
}) {
  const currentOrder = STAGE_INFO[currentStage].order;

  return (
    <div className="flex items-center gap-1 w-full">
      {STAGE_ORDER.map((stage, i) => {
        const info = STAGE_INFO[stage];
        const colors = STAGE_COLORS[stage];
        const isComplete = info.order < currentOrder;
        const isCurrent = stage === currentStage;
        const isFuture = info.order > currentOrder;

        return (
          <div key={stage} className="flex items-center flex-1">
            <button
              onClick={() => onAdvance(stage)}
              className={cn(
                'flex-1 relative py-3 px-2 rounded-lg border text-center transition-all text-xs font-medium',
                isCurrent && `${colors.bg} ${colors.border} ${colors.text}`,
                isComplete && 'bg-cyan/5 border-cyan/20 text-cyan/70',
                isFuture && 'bg-nex-dark border-nex-light text-slate-dim',
                !isFuture && 'hover:brightness-110 cursor-pointer',
                isFuture && 'cursor-default'
              )}
              disabled={isFuture}
            >
              {isComplete && (
                <CheckCircle2 className="h-3 w-3 absolute top-1 right-1 text-cyan/50" />
              )}
              <span className="block truncate">{info.label}</span>
            </button>
            {i < STAGE_ORDER.length - 1 && (
              <div className={cn(
                'w-4 h-0.5 shrink-0 mx-0.5',
                info.order < currentOrder ? 'bg-cyan/30' : 'bg-nex-light'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
