'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  GraduationCap,
  Briefcase,
  Shield,
  Rocket,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getForumCategories } from '../../actions/posts/categories';

interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  general: MessageSquare,
  academy: GraduationCap,
  careers: Briefcase,
  guardian: Shield,
  projects: Rocket,
};

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  general: { bg: 'bg-cyan/10', border: 'border-cyan/30', text: 'text-cyan' },
  academy: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  careers: { bg: 'bg-gold/10', border: 'border-gold/30', text: 'text-gold' },
  guardian: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  projects: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
};

interface CategoryCardsProps {
  className?: string;
  compact?: boolean;
}

function CategoryCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <Card className="bg-nex-surface border-nex-border">
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-center gap-3">
          <Skeleton className={compact ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-lg'} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            {!compact && <Skeleton className="h-3 w-full" />}
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryCards({ className, compact = false }: CategoryCardsProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      const result = await getForumCategories();
      if (result.success) {
        setCategories(result.categories);
      }
      setLoading(false);
    }
    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className={cn('grid gap-3', compact ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
          {[1, 2, 3, 4, 5].map((i) => (
            <CategoryCardSkeleton key={i} compact={compact} />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gold">Browse by Category</h2>
        <Link
          href="/nucleus/community/circles"
          className="flex items-center gap-1 text-sm text-cyan hover:text-cyan-soft transition-colors"
        >
          View all circles
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Category Grid */}
      <div className={cn(
        'grid gap-3',
        compact ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      )}>
        {categories.map((category) => {
          const Icon = categoryIcons[category.id] || MessageSquare;
          const colors = categoryColors[category.id] || categoryColors.general;

          return (
            <Link
              key={category.id}
              href={`/nucleus/community/circles?dimension=all&category=${category.id}`}
            >
              <Card
                className={cn(
                  'group cursor-pointer bg-nex-surface border-nex-border transition-all duration-300',
                  'hover:border-cyan/50 hover:shadow-card-hover'
                )}
              >
                <CardContent className={compact ? 'p-3' : 'p-4'}>
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-lg transition-colors',
                        colors.bg,
                        colors.border,
                        'border',
                        compact ? 'h-8 w-8' : 'h-10 w-10'
                      )}
                    >
                      <Icon className={cn(colors.text, compact ? 'h-4 w-4' : 'h-5 w-5')} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        'font-medium text-slate-light group-hover:text-cyan transition-colors truncate',
                        compact ? 'text-sm' : 'text-base'
                      )}>
                        {category.name}
                      </h3>
                      {!compact && (
                        <p className="text-xs text-slate-dim line-clamp-1 mt-0.5">
                          {category.description}
                        </p>
                      )}
                    </div>

                    {/* Post Count & Arrow */}
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'rounded-full bg-nex-light px-2 py-0.5 text-slate-dim',
                        compact ? 'text-xs' : 'text-xs'
                      )}>
                        {category.postCount}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-dim group-hover:text-cyan transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
