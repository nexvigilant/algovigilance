'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tag, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getTrendingTopicsSimple } from '../../actions/trending';

interface TagData {
  tag: string;
  count: number;
}

interface TagCloudProps {
  className?: string;
  maxTags?: number;
  showHeader?: boolean;
}

function TagCloudSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-7 rounded-full"
          style={{ width: `${Math.random() * 40 + 60}px` }}
        />
      ))}
    </div>
  );
}

export function TagCloud({ className, maxTags = 15, showHeader = true }: TagCloudProps) {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag');

  useEffect(() => {
    async function loadTags() {
      const result = await getTrendingTopicsSimple(maxTags);
      if (result.success && result.data) {
        // Transform TrendingTopic to TagData format
        setTags(result.data.map(t => ({ tag: t.topic, count: t.postCount })));
      }
      setLoading(false);
    }
    loadTags();
  }, [maxTags]);

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (activeTag === tag) {
      // Deselect if clicking the same tag
      params.delete('tag');
    } else {
      params.set('tag', tag);
    }

    router.push(`/nucleus/community/circles?${params.toString()}`);
  };

  // Calculate relative sizes based on count
  const maxCount = Math.max(...tags.map((t) => t.count), 1);
  const minCount = Math.min(...tags.map((t) => t.count), 1);

  const getTagSize = (count: number) => {
    if (maxCount === minCount) return 'text-sm';
    const ratio = (count - minCount) / (maxCount - minCount);
    if (ratio > 0.66) return 'text-base font-medium';
    if (ratio > 0.33) return 'text-sm';
    return 'text-xs';
  };

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {showHeader && (
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
        )}
        <TagCloudSkeleton count={maxTags} />
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {showHeader && (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan" />
          <span className="text-sm font-medium text-slate-light">Trending Topics</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tagData) => {
          const isActive = activeTag === tagData.tag;

          return (
            <button
              key={tagData.tag}
              onClick={() => handleTagClick(tagData.tag)}
              className="focus:outline-none focus:ring-2 focus:ring-cyan/50 rounded-full"
            >
              <Badge
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  getTagSize(tagData.count),
                  isActive
                    ? 'bg-cyan text-nex-deep hover:bg-cyan/90'
                    : 'border-nex-border text-slate-dim hover:border-cyan/50 hover:text-cyan hover:bg-cyan/5'
                )}
              >
                <Tag className="mr-1 h-3 w-3" />
                {tagData.tag}
                <span className="ml-1.5 opacity-60">({tagData.count})</span>
              </Badge>
            </button>
          );
        })}
      </div>

      {activeTag && (
        <button
          onClick={() => handleTagClick(activeTag)}
          className="text-xs text-cyan hover:text-cyan-soft transition-colors"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
