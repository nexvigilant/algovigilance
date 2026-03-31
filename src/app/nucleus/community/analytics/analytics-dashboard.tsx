'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  MessageSquare,
  Activity,
  Flame,
  Award,
  BarChart3,
  Target,
} from 'lucide-react';
import { getCommunityAnalytics, getTrendingTopics } from '../actions/analytics';
import { cn } from '@/lib/utils';
import { VoiceLoading } from '@/components/voice';

import { logger } from '@/lib/logger';
const log = logger.scope('analytics/analytics-dashboard');

interface CommunityAnalytics {
  overview: {
    totalMembers: number;
    activeMembers: number;
    totalPosts: number;
    totalForums: number;
    growthRate: number;
  };
  engagement: {
    avgPostsPerDay: number;
    avgRepliesPerPost: number;
    avgResponseTime: number;
    topContributors: Array<{ userId: string; contributions: number }>;
  };
  trending: {
    hotForums: Array<{ forumId: string; name: string; activityScore: number }>;
    hotTopics: Array<{ topic: string; mentions: number }>;
    risingStars: Array<{ userId: string; growthRate: number }>;
  };
}

interface TrendingTopic {
  topic: string;
  postCount: number;
  growth: number;
  forums: string[];
}

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null);
  const [_trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const [analyticsResult, topicsResult] = await Promise.all([
        getCommunityAnalytics(period),
        getTrendingTopics('week'),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }

      if (topicsResult.success && topicsResult.data) {
        setTrendingTopics(topicsResult.data);
      }
    } catch (error) {
      log.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <VoiceLoading context="analytics" variant="fullpage" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center">
          <p className="text-cyan-soft">Unable to load analytics. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-cyan" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-gold">
              Community Analytics
            </h1>
          </div>
          <p className="text-cyan-soft/70">
            Insights into community growth, engagement, and trends
          </p>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(val) => setPeriod(val as typeof period)}>
          <TabsList className="bg-nex-surface border border-cyan/30">
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-nex-surface border-cyan/30">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-cyan-soft/70 text-xs">
                Total Members
              </CardDescription>
              <Users className="h-4 w-4 text-cyan-glow" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {analytics.overview.totalMembers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className="border-green-500/50 bg-green-500/10 text-green-400 text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                +{analytics.overview.growthRate}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-cyan/30">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-cyan-soft/70 text-xs">
                Active Members
              </CardDescription>
              <Activity className="h-4 w-4 text-nex-gold-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {analytics.overview.activeMembers.toLocaleString()}
            </div>
            <div className="text-xs text-cyan-soft/60">
              {((analytics.overview.activeMembers / analytics.overview.totalMembers) * 100).toFixed(
                1
              )}
              % engagement
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-cyan/30">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-cyan-soft/70 text-xs">
                Total Posts
              </CardDescription>
              <MessageSquare className="h-4 w-4 text-cyan-glow" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {analytics.overview.totalPosts.toLocaleString()}
            </div>
            <div className="text-xs text-cyan-soft/60">
              {analytics.engagement.avgPostsPerDay} per day
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-cyan/30">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-cyan-soft/70 text-xs">
                Total Forums
              </CardDescription>
              <Target className="h-4 w-4 text-cyan-glow" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {analytics.overview.totalForums}
            </div>
            <div className="text-xs text-cyan-soft/60">Active communities</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Engagement Metrics */}
          <Card className="bg-nex-surface border-cyan/30">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-glow" />
                Engagement Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-cyan-soft/70 mb-2">Avg Posts/Day</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.engagement.avgPostsPerDay}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-cyan-soft/70 mb-2">Avg Replies/Post</div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.engagement.avgRepliesPerPost}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-cyan-soft/70 mb-2">Avg Response Time</div>
                  <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                    {analytics.engagement.avgResponseTime}
                    <span className="text-sm text-cyan-soft/60">hrs</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hot Forums */}
          <Card className="bg-nex-surface border-cyan/30">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Hot Forums
              </CardTitle>
              <CardDescription className="text-cyan-soft/70">
                Most active forums right now
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4">
                {analytics.trending.hotForums.map((forum, idx) => (
                  <div
                    key={forum.forumId}
                    className="flex items-center justify-between p-4 rounded-lg bg-nex-light/50 hover:bg-cyan/10 border border-transparent hover:border-cyan/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-cyan/20 border-2 border-cyan/40 flex items-center justify-center text-cyan-soft font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-white">{forum.name}</div>
                        <div className="text-sm text-cyan-soft/60">
                          Activity score: {forum.activityScore}/100
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'text-sm py-1 px-3',
                        forum.activityScore >= 90
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                          : forum.activityScore >= 80
                          ? 'bg-cyan/20 text-cyan-soft border-cyan/40'
                          : 'bg-green-500/20 text-green-300 border-green-500/40'
                      )}
                    >
                      {forum.activityScore >= 90 ? '🔥 Hot' : forum.activityScore >= 80 ? '⚡ Active' : '📈 Growing'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Contributors */}
          <Card className="bg-nex-surface border-cyan/30">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-nex-gold-400" />
                Top Contributors
              </CardTitle>
              <CardDescription className="text-cyan-soft/70">
                Most active community members
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3">
                {analytics.engagement.topContributors.map((contributor, idx) => (
                  <div
                    key={contributor.userId}
                    className="flex items-center justify-between p-3 rounded-lg bg-nex-light/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          'text-sm py-1 px-2',
                          idx === 0
                            ? 'bg-nex-gold-500/20 text-nex-gold-300 border-nex-gold-500/40'
                            : idx === 1
                            ? 'bg-gray-400/20 text-gray-300 border-gray-400/40'
                            : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        )}
                      >
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </Badge>
                      <span className="text-white">User {contributor.userId}</span>
                    </div>
                    <div className="text-sm text-cyan-soft">
                      {contributor.contributions} contributions
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Topics */}
          <Card className="bg-nex-surface border-cyan/30">
            <CardHeader className="p-4">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Trending Topics
              </CardTitle>
              <CardDescription className="text-xs text-cyan-soft/70">
                Hot topics this week
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {analytics.trending.hotTopics.map((topic, idx) => (
                  <div
                    key={topic.topic}
                    className="p-3 rounded-lg bg-nex-light/50 hover:bg-cyan/10 border border-transparent hover:border-cyan/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-bold text-cyan-soft">#{idx + 1}</span>
                      <span className="text-sm font-medium text-white flex-1">
                        {topic.topic.replace(/-/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-cyan-soft/60">{topic.mentions} mentions</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rising Stars */}
          <Card className="bg-nex-surface border-cyan/30">
            <CardHeader className="p-4">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Rising Stars
              </CardTitle>
              <CardDescription className="text-xs text-cyan-soft/70">
                Fastest growing contributors
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {analytics.trending.risingStars.map((star) => (
                  <div
                    key={star.userId}
                    className="p-3 rounded-lg bg-nex-light/50 flex items-center justify-between"
                  >
                    <span className="text-sm text-white">User {star.userId}</span>
                    <Badge
                      variant="outline"
                      className="border-green-500/50 bg-green-500/10 text-green-400 text-xs"
                    >
                      +{star.growthRate.toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
