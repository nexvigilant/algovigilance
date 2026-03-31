import { STAGE_INFO, type ProgramStage } from '@/lib/actions/programs';
import { cn } from '@/lib/utils';

export function StagePipeline({ currentStage }: { currentStage: ProgramStage }) {
  const stages = Object.entries(STAGE_INFO) as [ProgramStage, { label: string; order: number }][];
  const currentOrder = STAGE_INFO[currentStage].order;

  return (
    <div className="flex items-center gap-1">
      {stages.map(([stage, info]) => (
        <div
          key={stage}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            info.order <= currentOrder ? 'bg-cyan' : 'bg-nex-light'
          )}
          title={info.label}
        />
      ))}
    </div>
  );
}
