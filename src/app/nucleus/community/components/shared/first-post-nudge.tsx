'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  PenLine,
  Users,
  MessageSquare,
  HelpCircle,
  X,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface FirstPostNudgeProps {
  /** User's current post count */
  postCount: number;
  /** Number of circles the user has joined */
  circlesJoined?: number;
  /** Variant: 'banner' for top of page, 'card' for inline, 'minimal' for subtle */
  variant?: 'banner' | 'card' | 'minimal';
  /** Whether the nudge can be dismissed */
  dismissible?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * First Post Nudge Component
 *
 * Behavioral design: The #1 predictor of community retention is whether
 * a user posts within their first week. This nudge:
 * 1. Creates psychological commitment through gentle encouragement
 * 2. Reduces friction by linking directly to template-enabled editor
 * 3. Uses social proof ("Join X others who introduced themselves")
 * 4. Builds identity ("Become part of the community")
 */
export function FirstPostNudge({
  postCount,
  circlesJoined = 0,
  variant = 'card',
  dismissible = true,
  className,
}: FirstPostNudgeProps) {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [_showConfetti, _setShowConfetti] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    if (user?.uid) {
      const dismissedKey = `first-post-nudge-dismissed-${user.uid}`;
      const dismissed = localStorage.getItem(dismissedKey);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [user?.uid]);

  // Don't show if user has posted or dismissed
  if (postCount > 0 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    if (user?.uid) {
      localStorage.setItem(`first-post-nudge-dismissed-${user.uid}`, 'true');
    }
    setIsDismissed(true);
  };

  // Calculate engagement stage for personalized messaging
  const getEngagementMessage = () => {
    if (circlesJoined === 0) {
      return {
        headline: "Ready to join the conversation?",
        subtext: "Introduce yourself and connect with fellow AlgoVigilances across the network.",
        cta: "Make Your First Post",
        icon: PenLine,
      };
    } else if (circlesJoined <= 2) {
      return {
        headline: "You've joined your first circles! 🎉",
        subtext: "Now introduce yourself and let the community know what you're interested in.",
        cta: "Say Hello",
        icon: Users,
      };
    } else {
      return {
        headline: "You're exploring - now share!",
        subtext: "With " + circlesJoined + " circles joined, you're ready to contribute. Your perspective matters!",
        cta: "Share Your Thoughts",
        icon: MessageSquare,
      };
    }
  };

  const message = getEngagementMessage();
  const Icon = message.icon;

  if (variant === 'minimal') {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan/10 to-gold/10 border border-cyan/20",
        className
      )}>
        <Sparkles className="h-4 w-4 text-cyan animate-pulse" />
        <span className="text-sm text-cyan-soft/80">
          New here? <Link href="/nucleus/community/circles/create-post?template=introduction" className="text-cyan hover:underline font-medium">Introduce yourself</Link> and get connected!
        </span>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-auto text-cyan-soft/50 hover:text-cyan-soft"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan/20 via-nex-surface to-gold/10 border border-cyan/30",
        className
      )}>
        {/* Circuit pattern background */}
        <div className="absolute inset-0 opacity-5 bg-[url('/patterns/circuit.svg')] bg-repeat" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/20 border border-cyan/30 shrink-0">
              <Icon className="h-6 w-6 text-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {message.headline}
              </h3>
              <p className="text-sm text-cyan-soft/70 max-w-md">
                {message.subtext}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button asChild className="circuit-button flex-1 sm:flex-none">
              <Link href="/nucleus/community/circles/create-post?template=introduction">
                <PenLine className="h-4 w-4 mr-2" />
                {message.cta}
              </Link>
            </Button>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="text-cyan-soft/50 hover:text-cyan-soft p-2"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: Card variant
  return (
    <Card className={cn(
      "relative overflow-hidden border-dashed border-2 border-cyan/30 bg-gradient-to-br from-cyan/5 via-nex-surface to-gold/5",
      className
    )}>
      {/* Sparkle decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
        <Sparkles className="absolute top-4 right-4 h-8 w-8 text-gold animate-pulse" />
        <Sparkles className="absolute top-8 right-12 h-4 w-4 text-cyan animate-pulse delay-150" />
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-cyan-soft/50 hover:text-cyan-soft z-10"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/20 to-gold/20 border border-cyan/30 shrink-0">
            <Icon className="h-7 w-7 text-cyan" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              {message.headline}
            </h3>
            <p className="text-cyan-soft/70 mb-4">
              {message.subtext}
            </p>

            {/* Quick start options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <QuickStartOption
                icon={Users}
                label="Introduce Yourself"
                href="/nucleus/community/circles/create-post?template=introduction"
                highlight
              />
              <QuickStartOption
                icon={HelpCircle}
                label="Ask a Question"
                href="/nucleus/community/circles/create-post?template=question"
              />
              <QuickStartOption
                icon={Trophy}
                label="Share a Win"
                href="/nucleus/community/circles/create-post?template=showcase"
              />
            </div>

            {/* Benefits list */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cyan-soft/60">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Get personalized help
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Build your reputation
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Connect with experts
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickStartOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  highlight?: boolean;
}

function QuickStartOption({ icon: Icon, label, href, highlight }: QuickStartOptionProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        "hover:scale-[1.02]",
        highlight
          ? "bg-cyan/20 text-cyan border border-cyan/30 hover:bg-cyan/30"
          : "bg-nex-light text-cyan-soft/70 border border-cyan/20 hover:border-cyan/40 hover:text-cyan-soft"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
