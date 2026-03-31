import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VoiceEmptyStateCompact } from '@/components/voice';
import type { PostAdminHistoryEntry } from '@/lib/actions/community-posts';
import { formatDistanceToNow } from 'date-fns';

interface PostHistoryTabProps {
  history: PostAdminHistoryEntry[];
}

export function PostHistoryTab({ history }: PostHistoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-light">Admin Action History</CardTitle>
        <CardDescription className="text-slate-dim">
          Recent moderation actions on posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div>
                  <p className="font-medium">
                    <span className="capitalize">{action.type}</span>
                    {action.postTitle && (
                      <span className="text-slate-dim"> - {action.postTitle}</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-dim">
                    by {action.adminName}
                    {action.reason && ` • ${action.reason}`}
                  </p>
                </div>
                <p className="text-sm text-slate-dim">
                  {formatDistanceToNow(action.createdAt, { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <VoiceEmptyStateCompact context="posts" description="No admin actions yet" />
        )}
      </CardContent>
    </Card>
  );
}
