'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUnreadCounts } from '@/hooks/use-unread-counts';

interface BadgeIndicatorProps {
  count: number;
  icon: React.ReactNode;
  href: string;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

function BadgeIndicator({ count, icon, href, label, onClick, isActive }: BadgeIndicatorProps) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        'relative isolate transition-colors touch-target min-w-[44px]',
        isActive
          ? 'text-cyan bg-cyan/10'
          : 'text-slate-dim hover:text-slate-light'
      )}
      aria-label={`${label}${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <Link href={href} onClick={onClick}>
        {icon}
        {count > 0 && (
          <span
            className={cn(
              'absolute top-0 right-0 flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1 rounded-full',
              'bg-cyan text-nex-deep text-[10px] font-bold',
              'animate-in zoom-in-50 duration-200'
            )}
            aria-hidden="true"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function NavBadgeIndicators() {
  const pathname = usePathname();
  const {
    messageCount,
    notificationCount,
    isLoading,
    markMessagesViewed,
    markNotificationsViewed,
  } = useUnreadCounts();

  // Check if we're on messages or notifications page
  const isOnMessages = pathname?.includes('/messages');
  const isOnNotifications = pathname?.includes('/notifications');

  // Don't render anything while loading to avoid layout shift
  if (isLoading) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-dim/50 touch-target min-w-[44px]"
          disabled
          aria-label="Messages loading"
        >
          <Mail className="h-5 w-5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-dim/50 touch-target min-w-[44px]"
          disabled
          aria-label="Notifications loading"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" role="region" aria-label="Notifications" aria-live="polite">
      <BadgeIndicator
        count={messageCount}
        icon={<Mail className="h-5 w-5" aria-hidden="true" />}
        href="/nucleus/community/messages"
        label="Messages"
        onClick={markMessagesViewed}
        isActive={isOnMessages}
      />
      <BadgeIndicator
        count={notificationCount}
        icon={<Bell className="h-5 w-5" aria-hidden="true" />}
        href="/nucleus/community/notifications"
        label="Notifications"
        onClick={markNotificationsViewed}
        isActive={isOnNotifications}
      />
    </div>
  );
}
