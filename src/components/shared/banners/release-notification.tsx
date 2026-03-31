'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import changelog from '@/data/changelog.json';

const STORAGE_KEY = 'nexvigilant-seen-version';
const DISMISS_KEY = 'nexvigilant-release-dismissed';

interface ReleaseNotificationProps {
  /** Position of the notification */
  position?: 'top' | 'bottom';
  /** Custom class name */
  className?: string;
  /** Callback when user clicks "View Changes" */
  onViewChanges?: () => void;
}

/**
 * Shows a notification banner when a new version is released.
 * Stores the last seen version in localStorage to avoid repeated prompts.
 */
export function ReleaseNotification({
  position = 'bottom',
  className,
  onViewChanges,
}: ReleaseNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const currentVersion = changelog.currentVersion;
  const latestEntry = changelog.entries[0];

  useEffect(() => {
    // Check if user has seen this version
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    const dismissed = localStorage.getItem(DISMISS_KEY);

    // If they haven't seen this version and haven't dismissed recently
    if (seenVersion !== currentVersion) {
      // Check if dismiss was for current version
      // Wrap in try/catch to handle corrupted localStorage values
      let dismissData: { version?: string } | null = null;
      if (dismissed) {
        try {
          dismissData = JSON.parse(dismissed);
        } catch {
          // Corrupted data - clear it and show notification
          localStorage.removeItem(DISMISS_KEY);
        }
      }
      if (dismissData?.version !== currentVersion) {
        setIsNew(true);
        setIsVisible(true);
      }
    }
  }, [currentVersion]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismiss for this version (expires when version changes)
    localStorage.setItem(
      DISMISS_KEY,
      JSON.stringify({ version: currentVersion, timestamp: Date.now() })
    );
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 px-4 py-2',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'mx-auto max-w-4xl rounded-lg border shadow-lg',
          'bg-gradient-to-r from-nex-surface via-nex-dark to-nex-surface',
          'border-cyan/30'
        )}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          {/* Left: Icon and message */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan/20">
              <Sparkles className="h-4 w-4 text-cyan" aria-hidden="true" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold text-white">
                {isNew ? "What's New" : 'Release Notes'}
              </span>
              <span className="text-sm text-slate-light/70">
                v{currentVersion} — {latestEntry?.title}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onViewChanges?.();
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5',
                'bg-cyan text-nex-deep font-medium text-sm',
                'hover:bg-cyan-glow transition-colors'
              )}
            >
              View Changes
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={handleDismiss}
              className={cn(
                'p-1.5 rounded-md text-slate-light/60',
                'hover:text-white hover:bg-white/10 transition-colors'
              )}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version badge that pulses when there's a new version
 */
interface VersionBadgeProps {
  showPulse?: boolean;
  className?: string;
}

export function VersionBadge({ showPulse = false, className }: VersionBadgeProps) {
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    if (seenVersion !== changelog.currentVersion) {
      setHasNewVersion(true);
    }
  }, []);

  return (
    <Link
      href="/changelog"
      className={cn(
        'relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'bg-cyan/10 border border-cyan/20 text-cyan text-xs',
        'hover:bg-cyan/20 hover:border-cyan/40 transition-colors',
        className
      )}
    >
      {(showPulse || hasNewVersion) && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan" />
        </span>
      )}
      <span>v{changelog.currentVersion}</span>
      <span className="text-cyan/60">beta</span>
    </Link>
  );
}

// Re-export hook from canonical location for backward compatibility
export { useNewVersion } from '@/hooks/use-new-version';
