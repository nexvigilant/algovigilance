'use client';

import Link from 'next/link';
import { useAnalytics } from '@/hooks/use-analytics';
import type { AnalyticsEvent, AnalyticsProperties } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface TrackedLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  event: AnalyticsEvent;
  properties?: AnalyticsProperties;
  children: React.ReactNode;
}

/**
 * A wrapper around Next.js Link that automatically tracks an analytics event on click.
 */
export function TrackedLink({
  event,
  properties,
  children,
  className,
  onClick,
  ...props
}: TrackedLinkProps) {
  const { track } = useAnalytics();

  return (
    <Link
      {...props}
      className={cn(className)}
      onClick={(e) => {
        track(event, properties);
        if (onClick) onClick(e);
      }}
    >
      {children}
    </Link>
  );
}
