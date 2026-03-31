'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Award, UserPlus, MessageSquare, Loader2, RefreshCw, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRecentActivity, type RecentActivity } from '../platform-stats-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('components/recent-activity');

function ActivityIcon({ type }: { type: RecentActivity['type'] }) {
  const iconMap = {
    enrollment: <GraduationCap className="h-4 w-4 text-cyan" />,
    certificate: <Award className="h-4 w-4 text-gold" />,
    signup: <UserPlus className="h-4 w-4 text-emerald-400" />,
    post: <MessageSquare className="h-4 w-4 text-purple-400" />,
  };
  return iconMap[type] || <Activity className="h-4 w-4 text-slate-dim" />;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchActivity() {
    try {
      const recentActivity = await getRecentActivity(10);
      setActivities(recentActivity);
    } catch (error) {
      log.error('Failed to fetch recent activity:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchActivity();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchActivity();
  }

  return (
    <Card className="bg-nex-surface border border-nex-light">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-light flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan" />
            Recent Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="text-slate-dim hover:text-cyan"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 text-slate-dim mx-auto mb-2" />
            <p className="text-sm text-slate-dim">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div
                key={`${activity.type}-${activity.timestamp}-${index}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-nex-light/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-nex-light/50">
                  <ActivityIcon type={activity.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-light">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-dim truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-slate-dim whitespace-nowrap">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
