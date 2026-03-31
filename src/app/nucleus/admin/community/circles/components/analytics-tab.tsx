'use client';

import {
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CircleAnalytics } from '../actions';

interface AnalyticsTabProps {
  analytics: CircleAnalytics;
}

// Brand colors
const COLORS = {
  primary: 'hsl(189 100% 50%)',
  secondary: 'hsl(42 89% 60%)',
  accent: 'hsl(210 53% 23%)',
};

export function AnalyticsTab({ analytics }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeMembers} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalReplies} replies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.growthRate}%</div>
            <p className="text-xs text-muted-foreground">
              of members active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalMembers > 0
                ? (analytics.totalPosts / analytics.totalMembers).toFixed(1)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              posts per member
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Activity (Last 7 Days)</CardTitle>
            <CardDescription>Posts and replies by day</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.activityByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.activityByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-US', {
                        weekday: 'short',
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <Bar
                    dataKey="posts"
                    fill={COLORS.primary}
                    name="Posts"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="replies"
                    fill={COLORS.secondary}
                    name="Replies"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Members with most posts</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topContributors.length > 0 ? (
              <div className="space-y-4">
                {analytics.topContributors.map((contributor, index) => (
                  <div
                    key={contributor.odspId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{contributor.odName}</span>
                    </div>
                    <Badge variant="outline">
                      {contributor.contributions} posts
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No contributors yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Member Growth (simplified) */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Circle health overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Posts per Day
              </div>
              <div className="mt-1 text-2xl font-bold">
                {analytics.activityByDay.length > 0
                  ? (
                      analytics.activityByDay.reduce(
                        (acc, day) => acc + day.posts,
                        0
                      ) / 7
                    ).toFixed(1)
                  : 0}
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Replies per Post
              </div>
              <div className="mt-1 text-2xl font-bold">
                {analytics.totalPosts > 0
                  ? (analytics.totalReplies / analytics.totalPosts).toFixed(1)
                  : 0}
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Member Retention
              </div>
              <div className="mt-1 text-2xl font-bold">
                {analytics.growthRate}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
