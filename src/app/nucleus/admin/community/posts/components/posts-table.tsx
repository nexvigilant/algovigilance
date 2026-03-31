'use client';

import {
  Eye,
  Heart,
  MessageSquare,
  Pin,
  Lock,
  EyeOff,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VoiceEmptyStateCompact } from '@/components/voice';
import { cn, toDate } from '@/lib/utils';
import type { PostWithAuthor } from '@/lib/actions/community-posts';
import { formatDistanceToNow } from 'date-fns';

interface PostsTableProps {
  posts: PostWithAuthor[];
  selectedPosts: Set<string>;
  onToggleSelectAll: () => void;
  onToggleSelectPost: (postId: string) => void;
  onTogglePin: (postId: string) => void;
  onToggleLock: (postId: string) => void;
  onToggleHide: (postId: string) => void;
  onDeleteClick: (post: PostWithAuthor) => void;
}

export function PostsTable({
  posts,
  selectedPosts,
  onToggleSelectAll,
  onToggleSelectPost,
  onTogglePin,
  onToggleLock,
  onToggleHide,
  onDeleteClick,
}: PostsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedPosts.size === posts.length && posts.length > 0}
                    onCheckedChange={onToggleSelectAll}
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium">Post</th>
                <th className="p-4 text-left text-sm font-medium">Author</th>
                <th className="p-4 text-left text-sm font-medium">Stats</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                <th className="p-4 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className={cn(
                    'border-b hover:bg-muted/50',
                    post.isHidden && 'opacity-50'
                  )}
                >
                  <td className="p-4">
                    <Checkbox
                      checked={selectedPosts.has(post.id)}
                      onCheckedChange={() => onToggleSelectPost(post.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="max-w-[300px]">
                      <p className="font-medium truncate">{post.title}</p>
                      <p className="text-sm text-slate-dim">
                        {post.category} •{' '}
                        {formatDistanceToNow(toDate(post.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{post.authorName}</p>
                      <p className="text-sm text-slate-dim">{post.authorEmail}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3 text-sm text-slate-dim">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.viewCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {Object.values(post.reactionCounts || {}).reduce(
                          (a, b) => a + b,
                          0
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.replyCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {post.isPinned && (
                        <Badge variant="secondary" className="text-xs">
                          <Pin className="mr-1 h-3 w-3" />
                          Pinned
                        </Badge>
                      )}
                      {post.isLocked && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="mr-1 h-3 w-3" />
                          Locked
                        </Badge>
                      )}
                      {post.isHidden && (
                        <Badge variant="destructive" className="text-xs">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onTogglePin(post.id)}>
                          <Pin className="mr-2 h-4 w-4" />
                          {post.isPinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleLock(post.id)}>
                          <Lock className="mr-2 h-4 w-4" />
                          {post.isLocked ? 'Unlock' : 'Lock'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleHide(post.id)}>
                          <EyeOff className="mr-2 h-4 w-4" />
                          {post.isHidden ? 'Unhide' : 'Hide'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDeleteClick(post)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {posts.length === 0 && (
          <VoiceEmptyStateCompact context="posts" description="No posts found" />
        )}
      </CardContent>
    </Card>
  );
}
