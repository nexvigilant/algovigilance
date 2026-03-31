'use client';

import { Eye, EyeOff, Pin, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type BulkAction = 'hide' | 'unhide' | 'delete' | 'pin' | 'unpin';

interface PostBulkActionsProps {
  selectedCount: number;
  loading: boolean;
  onBulkAction: (action: BulkAction) => void;
}

export function PostBulkActions({
  selectedCount,
  loading,
  onBulkAction,
}: PostBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className="mb-4 border-primary">
      <CardContent className="flex items-center justify-between py-3">
        <span className="text-sm font-medium">{selectedCount} post(s) selected</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction('hide')}
            disabled={loading}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Hide
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction('unhide')}
            disabled={loading}
          >
            <Eye className="mr-2 h-4 w-4" />
            Unhide
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction('pin')}
            disabled={loading}
          >
            <Pin className="mr-2 h-4 w-4" />
            Pin
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onBulkAction('delete')}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
