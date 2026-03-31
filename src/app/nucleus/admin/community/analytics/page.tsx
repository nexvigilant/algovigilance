'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3 as _BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Activity,
  Flame,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getCommunityAnalytics, getEngagementHeatmap } from '@/app/nucleus/community/actions/analytics';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { logger } from '@/lib/logger';
const log = logger.scope('analytics/page');

interface CommunityAnalyticsData {
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

interface HeatmapEntry {
  hour: string;
  count: number;
}

// Brand-compliant color palette
// Using design system tokens for visual consistency
const COLORS = {
  cyan: 'hsl(189 100% 50%)',        // Primary engagement
  gold: 'hsl(42 89% 60%)',          // Secondary/premium
  navyLight: 'hsl(210 53% 23%)',    // Muted elements
  cyanSoft: 'hsl(189 100% 70%)',    // Light accents
  goldLight: 'hsl(42 89% 76%)',     // Light gold
  // Guardian Protocol colors (safety/risk visualization)
  risk: 'hsl(0 84% 60%)',           // Aligned with --destructive
  riskHigh: 'hsl(0 90% 50%)',       // Critical risk (brighter)
  warning: 'hsl(38 92% 50%)',       // Warning/amber
};

export default function CommunityAnalyticsPage() {
  const [data, setData] = useState<CommunityAnalyticsData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [showRisk, setShowRisk] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const [analyticsRes, heatmapRes] = await Promise.all([
        getCommunityAnalytics(period as '7d' | '30d' | '90d'),
        getEngagementHeatmap()
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setData(analyticsRes.data);
      }
      if (heatmapRes.success && heatmapRes.data) {
        setHeatmap(heatmapRes.data);
      }
    } catch (error) {
      log.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const trendingTopicsData = (data?.trending?.hotTopics ?? []).map((t) => ({
    name: t.topic,
    value: t.mentions,
  }));

  const topContributorsData = (data?.engagement?.topContributors ?? []).map((c) => ({
    name: c.userId,
    value: c.contributions,
  }));

  const hotForumsData = (data?.trending?.hotForums ?? []).map((f) => ({
    name: f.name,
    value: f.activityScore,
  }));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
            Community Analytics
          </h1>
          <p className="text-slate-dim">
            Insights into community growth, engagement, and trends
          </p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total Members</CardTitle>
            <Users className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.overview?.totalMembers || 0}
            </div>
            <p className="mt-1 text-xs text-slate-dim">
              +{data?.overview?.growthRate || 0}% growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">
              Active Members
            </CardTitle>
            <Activity className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.overview?.activeMembers || 0}
            </div>
            <p className="mt-1 text-xs text-slate-dim">
              {(
                ((data?.overview?.activeMembers || 0) / (data?.overview?.totalMembers || 1)) *
                100
              ).toFixed(1)}
              % engagement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.overview?.totalPosts || 0}</div>
            <p className="mt-1 text-xs text-slate-dim">
              {data?.engagement?.avgPostsPerDay || 0} posts/day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">
              Avg Response Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.engagement?.avgResponseTime || 0}h
            </div>
            <p className="mt-1 text-xs text-slate-dim">
              Community responsiveness
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topics & Trends</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-slate-light flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Real-time Engagement (Last 24h)
                </CardTitle>
                <CardDescription className="text-slate-dim">
                  Activity velocity vs. Risk scores across all circles
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="risk-mode" checked={showRisk} onCheckedChange={setShowRisk} />
                <Label htmlFor="risk-mode" className="text-xs text-slate-dim cursor-pointer">Risk Overlay</Label>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={heatmap}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                    itemStyle={{ color: COLORS.cyan }}
                  />
                  <Line
                    name="Engagement"
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.cyan}
                    strokeWidth={3}
                    dot={{ fill: COLORS.cyan, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  {showRisk && (
                    <Line
                      name="Avg Risk"
                      type="monotone"
                      dataKey="avgRisk"
                      stroke={COLORS.risk}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: COLORS.risk, r: 3 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Hot Forums */}
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Most Active Circles</CardTitle>
                <CardDescription className="text-slate-dim">Based on activity score</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hotForumsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill={COLORS.cyan}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Distribution (Mock) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Engagement Distribution</CardTitle>
                <CardDescription className="text-slate-dim">Posts vs Replies vs Reactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Posts', value: 30, color: COLORS.cyan },
                        { name: 'Replies', value: 45, color: COLORS.gold },
                        { name: 'Reactions', value: 25, color: COLORS.cyanSoft },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        { name: 'Posts', value: 30, color: COLORS.cyan },
                        { name: 'Replies', value: 45, color: COLORS.gold },
                        { name: 'Reactions', value: 25, color: COLORS.cyanSoft },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Trending Topics</CardTitle>
              <CardDescription className="text-slate-dim">
                Most discussed topics in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={trendingTopicsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Top Contributors</CardTitle>
              <CardDescription className="text-slate-dim">Users with highest engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topContributorsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.navyLight} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
