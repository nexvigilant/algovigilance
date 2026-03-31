'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updatePost } from '../../actions';

interface EditPostDialogProps {
  postId: string;
  initialTitle: string;
  initialContent: string;
  initialTags: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPostDialog({
  postId,
  initialTitle,
  initialContent,
  initialTags,
  open,
  onOpenChange,
}: EditPostDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTags.join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setContent(initialContent);
      setTags(initialTags.join(', '));
      setError(null);
      setSuccess(false);
    }
  }, [open, initialTitle, initialContent, initialTags]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Parse tags
      const tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 5); // Maximum 5 tags

      const result = await updatePost({
        postId,
        title: title.trim() !== initialTitle ? title.trim() : undefined,
        content: content.trim() !== initialContent ? content.trim() : undefined,
        tags: tagArray.join(',') !== initialTags.join(',') ? tagArray : undefined,
      });

      if (result.success) {
        setSuccess(true);
        // Close dialog after brief delay to show success message
        setTimeout(() => {
          onOpenChange(false);
          // Refresh the page to show updated content
          window.location.reload();
        }, 1000);
      } else {
        setError(result.error || 'Failed to update post');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Make changes to your post. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              minLength={5}
              maxLength={300}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/300 characters
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content... (supports basic markdown)"
              className="min-h-[200px] resize-none"
              minLength={10}
              maxLength={10000}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/10,000 characters • Supports **bold**, *italic*, `code`, [links](url)
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vigilance, drug-safety, signal-detection"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas (maximum 5 tags)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              Post updated successfully! Refreshing...
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
