import { STAGE_INFO, type ProgramRecord } from '@/lib/actions/programs';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAGE_COLORS, STATUS_COLORS } from './constants';
import { StagePipeline } from './stage-pipeline';

export function ProgramCard({ program }: { program: ProgramRecord }) {
  return (
    <Link href={`/nucleus/organization/programs/${program.id}`}>
      <div className="p-4 rounded-lg border border-nex-light bg-nex-dark/50 hover:border-cyan/30 hover:bg-cyan/5 transition-all group">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-slate-light text-sm truncate">{program.codeName}</h3>
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize',
                STATUS_COLORS[program.status] || STATUS_COLORS.active
              )}>
                {program.status}
              </span>
            </div>
            <p className="text-xs text-slate-dim truncate">{program.targetName}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-dim group-hover:text-cyan transition-colors shrink-0 mt-0.5" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
            STAGE_COLORS[program.currentStage]
          )}>
            {STAGE_INFO[program.currentStage].label}
          </span>
          <span className="text-[10px] text-slate-dim capitalize">
            {program.therapeuticArea.replace('_', ' ')}
          </span>
        </div>

        <StagePipeline currentStage={program.currentStage} />
      </div>
    </Link>
  );
}
