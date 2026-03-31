import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Sparkles } from 'lucide-react';
import type { PDCCPA } from '../actions';

const CATEGORY_COLORS: Record<string, string> = {
  Core: 'bg-blue-500/20 text-blue-500',
  Advanced: 'bg-purple-500/20 text-purple-500',
  Capstone: 'bg-gold/20 text-gold',
};

export function CPACard({ cpa, isCapstone = false }: { cpa: PDCCPA; isCapstone?: boolean }) {
  return (
    <Card
      className={`bg-nex-surface border border-nex-light rounded-lg ${isCapstone ? 'border-gold/50' : ''}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className={`text-lg ${isCapstone ? 'text-gold' : 'text-slate-light'}`}>
                {cpa.id}
              </CardTitle>
            </div>
            <CardDescription className="mt-1 text-slate-dim">
              {cpa.name}
            </CardDescription>
          </div>
          <Badge className={CATEGORY_COLORS[cpa.category] || 'bg-slate-500/20 text-slate-500'}>
            {cpa.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-dim mb-4 line-clamp-3">
          {cpa.definition}
        </p>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-slate-dim mb-1">
              Focus Area:
            </p>
            <Badge variant="secondary">{cpa.focusArea}</Badge>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-dim mb-1">
              Career Stage:
            </p>
            <Badge variant="outline">{cpa.careerStage}</Badge>
          </div>

          {cpa.keyEPAs?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-dim mb-1">
                Key EPAs:
              </p>
              <div className="flex flex-wrap gap-1">
                {cpa.keyEPAs.map((epaId) => (
                  <Badge key={epaId} variant="secondary" className="text-xs">
                    {epaId}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {cpa.dag?.layers?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-dim">
              <Layers className="h-3 w-3" />
              <span>Layers: {cpa.dag.layers.join(', ')}</span>
              {cpa.dag.isFullDAGTraversal && (
                <Badge variant="secondary" className="text-xs bg-gold/20 text-gold">
                  Full DAG
                </Badge>
              )}
            </div>
          )}

          {cpa.aiIntegration?.isAICapstone && (
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <Sparkles className="h-3 w-3" />
              <span>AI Capstone</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
