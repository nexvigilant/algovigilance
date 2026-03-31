'use client';

import { type LucideIcon, RotateCcw, Play, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AssessmentResumeDialogProps {
  lastUpdated: number | Date | null | undefined;
  lastStepLabel: string;
  onResume: () => void;
  onStartFresh: () => void;
  icon?: LucideIcon;
  variant?: 'amber' | 'emerald';
}

export function AssessmentResumeDialog({
  lastUpdated,
  lastStepLabel,
  onResume,
  onStartFresh,
  icon: Icon = RotateCcw,
  variant = 'amber'
}: AssessmentResumeDialogProps) {
  const isAmber = variant === 'amber';
  const colorClass = isAmber ? 'text-amber-500' : 'text-emerald-500';
  const bgClass = isAmber ? 'bg-amber-500/10' : 'bg-emerald-500/10';
  const borderClass = isAmber ? 'border-amber-500/30' : 'border-emerald-500/30';
  const btnClass = isAmber ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600';

  const formattedDate = lastUpdated
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(lastUpdated)
    : 'Recently';

  return (
    <Card className={`bg-nex-surface max-w-xl mx-auto mt-12 ${borderClass}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgClass}`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
          <div>
            <CardTitle className="text-lg text-foreground">Resume Your Progress?</CardTitle>
            <CardDescription>
              You have an unfinished assessment from {formattedDate}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-nex-dark rounded-lg">
          <div className="text-sm text-muted-foreground">Last step completed</div>
          <div className="font-medium text-foreground">{lastStepLabel}</div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onResume}
            className={`w-full text-white ${btnClass}`}
          >
            <Play className="h-4 w-4 mr-2" />
            Continue Where I Left Off
          </Button>
          <Button
            variant="outline"
            onClick={onStartFresh}
            className="w-full border-nex-border"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Start Fresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
