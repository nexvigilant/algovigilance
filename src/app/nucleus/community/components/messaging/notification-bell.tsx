"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, MessageSquare, Heart, Award, Mail, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@/types/community";
import { markNotificationRead } from "../../actions/messaging/notifications";
import { cn } from "@/lib/utils";
import { VoiceLoading, VoiceEmptyStateCompact } from "@/components/voice";
import { parseTimestamp } from "@/lib/firestore-utils";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  createNotificationsListener,
  createUnreadNotificationsListener,
} from "@/lib/data/notifications";

import { logger } from "@/lib/logger";
const log = logger.scope("components/notification-bell");

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const previousUnreadCountRef = useRef<number>(0);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Create notification sound
    notificationSoundRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizcIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrg",
    );

    // Set up real-time listener for notifications (extracted to lib/data)
    const unsubscribeNotifications = createNotificationsListener(
      user.uid,
      (notifs) => {
        setNotifications(notifs);
        setIsLoading(false);

        // Check for new notifications and show toast
        const currentUnreadCount = notifs.filter((n) => !n.read).length;

        if (
          previousUnreadCountRef.current > 0 &&
          currentUnreadCount > previousUnreadCountRef.current
        ) {
          // New notification(s) arrived
          const newNotifications = notifs
            .filter((n) => !n.read)
            .slice(0, currentUnreadCount - previousUnreadCountRef.current);

          newNotifications.forEach((notification) => {
            // Play sound
            if (notificationSoundRef.current) {
              notificationSoundRef.current
                .play()
                .catch((e) => log.debug("Could not play sound:", e));
            }

            // Show toast
            toast({
              title: notification.title,
              description: notification.message,
              duration: 5000,
            });
          });
        }

        previousUnreadCountRef.current = currentUnreadCount;
      },
    );

    // Set up real-time listener for unread count (extracted to lib/data)
    const unsubscribeUnread = createUnreadNotificationsListener(
      user.uid,
      (count) => setUnreadCount(count),
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnread();
    };
  }, []);

  async function handleMarkAsRead(notificationId: string) {
    await markNotificationRead(notificationId);
    // No need to reload - onSnapshot will update automatically
  }

  function getNotificationIcon(type: Notification["type"]) {
    switch (type) {
      case "reply":
        return <MessageSquare className="h-4 w-4 text-cyan" />;
      case "reaction":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "badge":
        return <Award className="h-4 w-4 text-nex-gold-500" />;
      case "message":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "mention":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-dark text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-96" align="end">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <VoiceLoading
              context="community"
              variant="spinner"
              message="Loading..."
              className="py-8"
            />
          ) : notifications.length === 0 ? (
            <VoiceEmptyStateCompact
              context="notifications"
              description="No notifications yet"
            />
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "cursor-pointer p-3 transition-colors hover:bg-muted/30",
                    !notification.read && "bg-cyan/5",
                  )}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                    if (notification.actionUrl) {
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 text-sm font-semibold">
                        {notification.title}
                      </h4>
                      <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            parseTimestamp(notification.createdAt),
                            { addSuffix: true },
                          )}
                        </span>
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            className="text-xs text-cyan hover:text-cyan-glow"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Read indicator */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-cyan" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t border-border p-3">
            <Link
              href="/nucleus/community/notifications"
              className="block text-center text-sm text-cyan hover:text-cyan-glow"
              onClick={() => setIsOpen(false)}
            >
              View all notifications →
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
