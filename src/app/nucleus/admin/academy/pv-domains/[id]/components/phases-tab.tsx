import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ImplementationPhase } from '@/types/pv-curriculum';

interface PhasesTabProps {
  phases: ImplementationPhase[];
}

export function PhasesTab({ phases }: PhasesTabProps) {
  return (
    <div className="space-y-4">
      {phases.map(phase => (
        <Card key={phase.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                {phase.phase}
              </div>
              <div>
                <CardTitle className="text-lg text-slate-light">{phase.phaseName}</CardTitle>
                <CardDescription className="text-slate-dim">Duration: {phase.duration}</CardDescription>
              </div>
              {phase.reviewRequired && (
                <Badge variant="destructive" className="ml-auto">Review Required</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Focus Areas:</span>
                <p className="text-slate-dim">{phase.focusAreas}</p>
              </div>
              <div>
                <span className="font-semibold">Key Activities:</span>
                <p className="text-slate-dim">{phase.keyActivities}</p>
              </div>
              <div>
                <span className="font-semibold">Assessment Gate:</span>
                <p className="text-slate-dim">{phase.assessmentGate}</p>
              </div>
              <div>
                <span className="font-semibold">Resources Required:</span>
                <p className="text-slate-dim">{phase.resourcesRequired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
