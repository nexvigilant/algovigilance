import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PostAnalytics } from '@/lib/actions/community-posts';
import { formatDistanceToNow } from 'date-fns';

interface PostAnalyticsTabProps {
  analytics: PostAnalytics | null;
}

export function PostAnalyticsTab({ analytics }: PostAnalyticsTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-light">Top Posts</CardTitle>
          <CardDescription className="text-slate-dim">By views and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.topPosts && analytics.topPosts.length > 0 ? (
            <div className="space-y-4">
              {analytics.topPosts.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                      {index + 1}
                    </span>
                    <p className="font-medium truncate max-w-[200px]">{post.title}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-dim">
                    <span>{post.views} views</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-dim">No data</p>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-light">Category Distribution</CardTitle>
          <CardDescription className="text-slate-dim">Posts by category</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.categoryDistribution && (
            <div className="space-y-3">
              {Object.entries(analytics.categoryDistribution).map(
                ([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize">{category}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-slate-light">Recent Activity</CardTitle>
          <CardDescription className="text-slate-dim">Latest posts created</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-slate-dim">
                      by {activity.authorName} • {activity.category}
                    </p>
                  </div>
                  <p className="text-sm text-slate-dim">
                    {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-dim">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
