import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface BulkProgress {
  current: number;
  total: number;
  currentItem: string;
  succeeded: number;
  failed: number;
}

interface BulkControlsProps {
  bulkProgress: BulkProgress | null;
  bulkGenerating: 'intelligence' | 'academy' | null;
}

export function BulkControls({ bulkProgress, bulkGenerating }: BulkControlsProps) {
  if (!bulkProgress) return null;

  return (
    <Card className="bg-nex-surface border-cyan/50 mb-8 animate-pulse">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-cyan" />
          Generating Images ({bulkGenerating === 'intelligence' ? 'Intelligence' : 'Academy'})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-dim">
            Processing {bulkProgress.current} of {bulkProgress.total}
          </span>
          <span className="text-white font-medium">
            {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
          </span>
        </div>
        <Progress
          value={(bulkProgress.current / bulkProgress.total) * 100}
          className="h-3"
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-dim truncate max-w-md" title={bulkProgress.currentItem}>
            Current: {bulkProgress.currentItem}
          </span>
          <div className="flex gap-4">
            <span className="text-green-400">{bulkProgress.succeeded} succeeded</span>
            {bulkProgress.failed > 0 && (
              <span className="text-red-400">{bulkProgress.failed} failed</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
