'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, ArrowUp, Hash } from 'lucide-react';
import { getTrendingTopics } from '../../actions/analytics';

import { logger } from '@/lib/logger';
const log = logger.scope('components/trending-topics');

interface TrendingTopic {
  topic: string;
  postCount: number;
  growth: number;
  forums: string[];
}

export function TrendingTopics() {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    loadTrendingTopics();
  }, []);

  async function loadTrendingTopics() {
    setLoading(true);
    try {
      const result = await getTrendingTopics('week');
      if (result.success && result.data) {
        setTopics(result.data);
      }
    } catch (error) {
      log.error('Error loading trending topics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="bg-nex-surface border-cyan/30">
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
            <CardTitle className="text-base text-white">Trending Topics</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-nex-light/50 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-nex-surface border-cyan/30">
      <CardHeader className="p-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" />
          <CardTitle className="text-base text-white">Trending Topics</CardTitle>
        </div>
        <CardDescription className="text-xs text-cyan-soft/70">
          Hot topics this week
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3" role="list" aria-label="Current trending community topics">
          {topics.map((topic, idx) => (
            <div
              key={topic.topic}
              role="listitem"
              className="group cursor-pointer p-3 rounded-lg bg-nex-light/50 hover:bg-cyan/10 border border-transparent hover:border-cyan/30 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold text-cyan-soft" aria-hidden="true">#{idx + 1}</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Hash className="h-3.5 w-3.5 text-cyan-glow flex-shrink-0" />
                    <span className="text-sm font-medium text-white truncate">
                      {topic.topic.replace(/-/g, ' ')}
                    </span>
                  </div>
                </div>
                {topic.growth > 0 && (
                  <Badge
                    variant="outline"
                    className="border-green-500/50 bg-green-500/10 text-green-400 text-xs flex items-center gap-1"
                  >
                    <ArrowUp className="h-3 w-3" />
                    {topic.growth.toFixed(0)}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-soft/60">{topic.postCount} posts</span>
                <span className="text-cyan-soft/50 truncate max-w-[150px]">
                  in {topic.forums.length} {topic.forums.length === 1 ? 'forum' : 'forums'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
