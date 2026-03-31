'use client';

import { useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { TIMING } from '@/lib/constants/timing';
import { getUnreadCounts } from '@/app/nucleus/community/actions/messaging/notifications';

import { logger } from '@/lib/logger';
const log = logger.scope('hooks/use-unread-counts');

interface UnreadCounts {
  messages: number;
  notifications: number;
}

// Fetcher for SWR
async function fetchUnreadCounts(): Promise<UnreadCounts> {
  return await getUnreadCounts();
}

/**
 * Hook for real-time unread counts with optimistic updates and toast notifications
 *
 * Features:
 * - Real-time Firebase listeners for instant updates
 * - SWR caching with stale-while-revalidate
 * - Optimistic updates when navigating to messages/notifications
 * - Toast notifications for new messages (when not on messages page)
 * - Pauses polling when tab is hidden
 */
export function useUnreadCounts() {
  const { user } = useAuth();
  const previousCounts = useRef<UnreadCounts>({ messages: 0, notifications: 0 });
  const isInitialized = useRef(false);

  // SWR for data fetching with caching
  const { data, isLoading, mutate } = useSWR<UnreadCounts>(
    user ? 'unread-counts' : null,
    fetchUnreadCounts,
    {
      refreshInterval: 0, // Disable polling - we use Firebase listeners instead
      revalidateOnFocus: true,
      keepPreviousData: true,
      dedupingInterval: TIMING.toastDuration,
      fallbackData: { messages: 0, notifications: 0 },
    }
  );

  // Real-time Firebase listener for notifications
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribes: Unsubscribe[] = [];

    // Listen for unread notifications
    const notificationsQuery = query(
      collection(db, 'users', user.uid, 'notifications'),
      where('read', '==', false)
    );

    const notificationsUnsub = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const newCount = snapshot.size;

        // Check if this is a new notification (count increased)
        if (isInitialized.current && newCount > previousCounts.current.notifications) {
          // Show toast for new notification
          const diff = newCount - previousCounts.current.notifications;
          if (diff === 1) {
            toast({ title: 'You have a new notification', variant: 'info' });
          } else {
            toast({ title: `You have ${diff} new notifications`, variant: 'info' });
          }
        }

        previousCounts.current.notifications = newCount;

        // Update SWR cache using functional updater to avoid `data` in effect deps
        mutate(
          (prev) => ({ ...(prev ?? { messages: 0, notifications: 0 }), notifications: newCount }),
          { revalidate: false }
        );
      },
      (error) => {
        log.error('Notifications listener error:', error);
      }
    );
    unsubscribes.push(notificationsUnsub);

    // Listen for conversations with unread messages
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', user.uid)
    );

    const conversationsUnsub = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        let totalUnread = 0;
        snapshot.docs.forEach((docSnapshot) => {
          const docData = docSnapshot.data();
          const unreadByUser = docData.unreadCountByUser || {};
          totalUnread += unreadByUser[user.uid] || 0;
        });

        // Check if this is a new message (count increased)
        if (isInitialized.current && totalUnread > previousCounts.current.messages) {
          // Only show toast if not on messages page
          if (!window.location.pathname.includes('/messages')) {
            const diff = totalUnread - previousCounts.current.messages;
            if (diff === 1) {
              toast({ title: 'You have a new message', variant: 'info' });
            } else {
              toast({ title: `You have ${diff} new messages`, variant: 'info' });
            }
          }
        }

        previousCounts.current.messages = totalUnread;

        // Update SWR cache using functional updater to avoid `data` in effect deps
        mutate(
          (prev) => ({ ...(prev ?? { messages: 0, notifications: 0 }), messages: totalUnread }),
          { revalidate: false }
        );
      },
      (error) => {
        log.error('Conversations listener error:', error);
      }
    );
    unsubscribes.push(conversationsUnsub);

    // Mark as initialized after first data load
    setTimeout(() => {
      isInitialized.current = true;
    }, TIMING.autosaveDelay);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
      isInitialized.current = false;
    };
    // Note: `data` removed from deps - using functional updater in mutate() instead
    // to prevent listener re-subscription on every SWR update
  }, [user?.uid, mutate]);

  // Optimistic update function - call when user views messages/notifications
  const markMessagesViewed = useCallback(() => {
    const currentCounts = data || { messages: 0, notifications: 0 };
    // Optimistically set messages to 0
    mutate({ ...currentCounts, messages: 0 }, { revalidate: false });
    previousCounts.current.messages = 0;
  }, [data, mutate]);

  const markNotificationsViewed = useCallback(() => {
    const currentCounts = data || { messages: 0, notifications: 0 };
    // Optimistically set notifications to 0
    mutate({ ...currentCounts, notifications: 0 }, { revalidate: false });
    previousCounts.current.notifications = 0;
  }, [data, mutate]);

  // Decrement a single count (for marking individual items as read)
  const decrementMessages = useCallback((count = 1) => {
    const currentCounts = data || { messages: 0, notifications: 0 };
    const newCount = Math.max(0, currentCounts.messages - count);
    mutate({ ...currentCounts, messages: newCount }, { revalidate: false });
    previousCounts.current.messages = newCount;
  }, [data, mutate]);

  const decrementNotifications = useCallback((count = 1) => {
    const currentCounts = data || { messages: 0, notifications: 0 };
    const newCount = Math.max(0, currentCounts.notifications - count);
    mutate({ ...currentCounts, notifications: newCount }, { revalidate: false });
    previousCounts.current.notifications = newCount;
  }, [data, mutate]);

  return {
    messageCount: data?.messages ?? 0,
    notificationCount: data?.notifications ?? 0,
    isLoading: isLoading && !data,
    // Optimistic update functions
    markMessagesViewed,
    markNotificationsViewed,
    decrementMessages,
    decrementNotifications,
    // Force refresh
    refresh: () => mutate(),
  };
}
