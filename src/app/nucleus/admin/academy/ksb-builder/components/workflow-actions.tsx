'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  MoreHorizontal,
  Send,
  CheckCircle,
  Archive,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import {
  submitForReview,
  publishKSB,
  archiveKSB,
  updateKSBStatus,
} from '@/lib/actions/ksb-builder';
import { useToast } from '@/hooks/use-toast';
import type { KSBContentStatus } from '@/types/pv-curriculum';

interface WorkflowActionsProps {
  domainId: string;
  ksbId: string;
  currentStatus: KSBContentStatus;
  userId: string;
  onStatusChange?: () => void;
}

export function WorkflowActions({
  domainId,
  ksbId,
  currentStatus,
  userId,
  onStatusChange,
}: WorkflowActionsProps) {
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'publish' | 'archive' | 'revert' | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: '',
    description: '',
  });
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleSubmitForReview = async () => {
    setLoading(true);
    try {
      const result = await submitForReview(domainId, ksbId, userId);
      if (result.success) {
        toast({
          title: 'Submitted for Review',
          description: 'Content has been submitted for review.',
        });
        onStatusChange?.();
      } else {
        toast({
          title: 'Submission Failed',
          description: result.error || 'Failed to submit for review',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    setLoading(true);
    try {
      let result;
      switch (confirmDialog.action) {
        case 'publish':
          result = await publishKSB(domainId, ksbId, userId, notes);
          break;
        case 'archive':
          result = await archiveKSB(domainId, ksbId, userId, notes);
          break;
        case 'revert':
          result = await updateKSBStatus(domainId, ksbId, 'draft', userId, notes);
          break;
        default:
          return;
      }

      if (result.success) {
        toast({
          title: 'Status Updated',
          description: `KSB has been ${confirmDialog.action === 'publish' ? 'published' : confirmDialog.action === 'archive' ? 'archived' : 'reverted to draft'}.`,
        });
        setConfirmDialog({ open: false, action: null, title: '', description: '' });
        setNotes('');
        onStatusChange?.();
      } else {
        toast({
          title: 'Update Failed',
          description: result.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Render based on current status
  const renderActions = () => {
    switch (currentStatus) {
      case 'draft':
        return (
          <Button
            size="sm"
            onClick={handleSubmitForReview}
            disabled={loading}
            className="gap-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit for Review
          </Button>
        );

      case 'generating':
        return (
          <Button size="sm" disabled className="gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </Button>
        );

      case 'review':
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() =>
                setConfirmDialog({
                  open: true,
                  action: 'publish',
                  title: 'Publish Content',
                  description: 'This will make the content available to learners.',
                })
              }
              disabled={loading}
              className="gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Publish
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    setConfirmDialog({
                      open: true,
                      action: 'revert',
                      title: 'Revert to Draft',
                      description: 'Send back to draft for further editing.',
                    })
                  }
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Revert to Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );

      case 'published':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    action: 'revert',
                    title: 'Send Back for Review',
                    description: 'Unpublish and send back for review.',
                  })
                }
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Send Back for Review
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    action: 'archive',
                    title: 'Archive Content',
                    description: 'Archive this content. It will no longer be available to learners.',
                  })
                }
                className="text-red-600"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );

      case 'archived':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setConfirmDialog({
                open: true,
                action: 'revert',
                title: 'Restore to Draft',
                description: 'Restore this content to draft status for editing.',
              })
            }
            disabled={loading}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            Restore
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderActions()}

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!loading) {
            setConfirmDialog({ ...confirmDialog, open });
            if (!open) setNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this action..."
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={loading}
              variant={confirmDialog.action === 'archive' ? 'destructive' : 'default'}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default WorkflowActions;
