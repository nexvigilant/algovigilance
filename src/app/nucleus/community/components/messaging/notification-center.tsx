'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Check,
  MessageSquare,
  Heart,
  Award,
  Mail,
  Info,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types/community';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '../../actions/messaging/notifications';
import { cn } from '@/lib/utils';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { parseTimestamp } from '@/lib/firestore-utils';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from 'firebase/firestore';

interface NotificationCenterProps {
  className?: string;
  maxHeight?: string;
}

export function NotificationCenter({
  className,
  maxHeight = '600px',
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, `users/${user.uid}/notifications`);

    let notificationsQuery = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (filter === 'unread') {
      notificationsQuery = query(
        notificationsRef,
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs: Notification[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];

        setNotifications(notifs);
        setIsLoading(false);
      }
    );

    // Set up real-time listener for unread count
    const unreadQuery = query(notificationsRef, where('read', '==', false));

    const unsubscribeUnread = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeUnread();
    };
  }, [filter]);

  async function handleMarkAsRead(notificationId: string) {
    await markNotificationRead(notificationId);
    // No need to reload - onSnapshot will update automatically
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    // No need to reload - onSnapshot will update automatically
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'reply':
        return <MessageSquare className="h-4 w-4 text-cyan" />;
      case 'reaction':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'badge':
        return <Award className="h-4 w-4 text-nex-gold-500" />;
      case 'message':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'mention':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  }

  const displayedNotifications = notifications;

  return (
    <Card className={cn('holographic-card', className)}>
      <CardHeader className="border-b border-border p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-cyan px-2 py-0.5 text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex-1"
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="flex-1"
          >
            Unread ({unreadCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-y-auto" style={{ maxHeight }}>
          {isLoading ? (
            <VoiceLoading context="community" variant="spinner" message="Loading notifications..." className="py-8" />
          ) : displayedNotifications.length === 0 ? (
            <VoiceEmptyState
              context="notifications"
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              description={filter === 'unread' ? 'You\'re all caught up!' : 'Notifications will appear here when you receive them'}
              variant="inline"
              size="sm"
            />
          ) : (
            <div className="divide-y divide-border">
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 transition-colors hover:bg-muted/30',
                    !notification.read && 'bg-cyan/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="flex-shrink-0 text-cyan hover:text-cyan-glow"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <p className="mb-2 text-sm text-muted-foreground">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            parseTimestamp(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </span>

                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            className="text-xs font-medium text-cyan hover:text-cyan-glow"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
