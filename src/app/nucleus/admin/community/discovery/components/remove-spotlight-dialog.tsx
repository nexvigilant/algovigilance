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
import type { SpotlightPost } from '../actions';

interface RemoveSpotlightDialogProps {
  spotlight: SpotlightPost | null;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
}

export function RemoveSpotlightDialog({
  spotlight,
  onOpenChange,
  onRemove,
}: RemoveSpotlightDialogProps) {
  return (
    <AlertDialog open={!!spotlight} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from Spotlight</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this post from the spotlight?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
