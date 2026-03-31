import { FileText, Eye, Heart, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PostAnalytics } from '@/lib/actions/community-posts';

interface PostStatsCardsProps {
  analytics: PostAnalytics;
}

export function PostStatsCards({ analytics }: PostStatsCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-dim">Total Posts</p>
              <p className="text-2xl font-bold">{analytics.totalPosts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Eye className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-slate-dim">Total Views</p>
              <p className="text-2xl font-bold">
                {analytics.totalViews.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-500/10 p-3">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-dim">Reactions</p>
              <p className="text-2xl font-bold">
                {analytics.totalReactions.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-500/10 p-3">
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-slate-dim">Replies</p>
              <p className="text-2xl font-bold">
                {analytics.totalReplies.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
