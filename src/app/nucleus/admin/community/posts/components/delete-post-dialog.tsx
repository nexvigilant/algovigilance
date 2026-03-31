'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import type { PostWithAuthor } from '@/lib/actions/community-posts';

interface DeletePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostWithAuthor | null;
  deleteReason: string;
  onReasonChange: (reason: string) => void;
  onDelete: () => void;
}

export function DeletePostDialog({
  open,
  onOpenChange,
  post,
  deleteReason,
  onReasonChange,
  onDelete,
}: DeletePostDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Post</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the post &quot;{post?.title}&quot;. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium">Reason for deletion</label>
          <Textarea
            placeholder="Enter reason..."
            value={deleteReason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
