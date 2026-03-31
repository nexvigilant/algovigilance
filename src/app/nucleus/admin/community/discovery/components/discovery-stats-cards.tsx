import { Star, Sparkles, Layers, TrendingUp, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DiscoveryStats } from '../actions';

interface DiscoveryStatsCardsProps {
  stats: DiscoveryStats;
  circleCount: number;
}

export function DiscoveryStatsCards({ stats, circleCount }: DiscoveryStatsCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-light">Categories</CardTitle>
          <Layers className="h-4 w-4 text-slate-dim" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCategories}</div>
          <p className="text-xs text-slate-dim">{stats.activeCategories} active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-light">Featured</CardTitle>
          <Star className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.featuredCircles}</div>
          <p className="text-xs text-slate-dim">circles</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-light">Spotlights</CardTitle>
          <Sparkles className="h-4 w-4 text-slate-dim" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.spotlightPosts}</div>
          <p className="text-xs text-slate-dim">active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-light">Trending</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-dim" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.trendingTopics}</div>
          <p className="text-xs text-slate-dim">topics</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-light">Total Circles</CardTitle>
          <Tag className="h-4 w-4 text-slate-dim" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{circleCount}</div>
          <p className="text-xs text-slate-dim">communities</p>
        </CardContent>
      </Card>
    </div>
  );
}
