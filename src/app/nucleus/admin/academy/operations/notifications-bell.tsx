'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Briefcase,
  Eye,
  CheckCircle,
  Sparkles,
  Trophy,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import {
  getUserOperationalNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type OperationalNotification,
  type OperationalNotificationType,
} from './notifications-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/notifications-bell');

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

function getNotificationIcon(type: OperationalNotificationType) {
  switch (type) {
    case 'assignment_new':
    case 'assignment_reassigned':
      return <Briefcase className="h-4 w-4 text-gold" />;
    case 'review_needed':
      return <Eye className="h-4 w-4 text-amber-400" />;
    case 'content_published':
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
    case 'batch_complete':
      return <Sparkles className="h-4 w-4 text-cyan" />;
    case 'batch_failed':
      return <AlertTriangle className="h-4 w-4 text-red-400" />;
    case 'milestone_reached':
      return <Trophy className="h-4 w-4 text-gold" />;
    case 'deadline_approaching':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    default:
      return <Bell className="h-4 w-4 text-slate-dim" />;
  }
}

export function NotificationsBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<OperationalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function fetchNotifications() {
    if (!user) return;

    try {
      const result = await getUserOperationalNotifications(user.uid, { limit: 20 });
      if (result.success) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch (error) {
      log.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleMarkRead(notificationId: string) {
    await markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-slate-dim hover:text-cyan"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-nex-surface border-nex-light"
        align="end"
      >
        <div className="flex items-center justify-between p-3 border-b border-nex-light">
          <h4 className="text-sm font-medium text-slate-light">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs text-slate-dim hover:text-cyan h-auto py-1"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-cyan" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 text-slate-dim mx-auto mb-2" />
            <p className="text-sm text-slate-dim">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="divide-y divide-nex-light">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-nex-light/50 transition-colors ${
                    !notification.read ? 'bg-cyan/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-full bg-nex-dark">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-light">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkRead(notification.id)}
                            className="h-5 w-5 p-0 text-slate-dim hover:text-cyan"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-slate-dim mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-dim">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {notification.metadata.actionUrl && (
                          <Link
                            href={notification.metadata.actionUrl}
                            onClick={() => {
                              handleMarkRead(notification.id);
                              setOpen(false);
                            }}
                            className="text-xs text-cyan hover:underline"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
