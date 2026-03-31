'use client';

import Link from 'next/link';
import {
  MessageSquare,
  BookOpen,
  Compass,
  Trophy,
  Bell,
  MessageCircle,
  Bookmark,
  Award,
  SearchX,
  Sparkles,
  Medal,
  BarChart3,
  Users,
  UserSearch,
  CircleDot,
  StickyNote,
  Star,
  FolderOpen,
  ShieldCheck,
  Inbox,
  Handshake,
  MessagesSquare,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EMPTY_STATE_CONTENT, type EmptyStateContext } from './constants';

// Map of empty state icons - only import what we need
const EMPTY_STATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  BookOpen,
  Compass,
  Trophy,
  Bell,
  MessageCircle,
  Bookmark,
  Award,
  SearchX,
  Sparkles,
  Medal,
  BarChart3,
  Users,
  UserSearch,
  CircleDot,
  StickyNote,
  Star,
  FolderOpen,
  ShieldCheck,
  Inbox,
  Handshake,
  MessagesSquare,
  CheckCircle2,
};

function getIcon(iconName?: string): React.ComponentType<{ className?: string }> | null {
  if (!iconName) return null;
  return EMPTY_STATE_ICONS[iconName] || null;
}

/**
 * Empty state action configuration
 */
export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Empty state component props
 */
export interface EmptyStateProps {
  /** Predefined context for automatic content generation */
  context?: EmptyStateContext;
  /** Title text (overrides context) */
  title?: string;
  /** Description text (overrides context) */
  description?: string;
  /** Alias for description (backwards compatibility) */
  message?: string;
  /** Lucide icon name (overrides context) */
  icon?: string;
  /** Primary action button (overrides context actionLabel) */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Visual variant */
  variant?: 'page' | 'card' | 'compact' | 'inline';
  /** Size modifier (applies to icon and text sizing) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty State component for when there's no content to display
 *
 * @example
 * // Basic usage
 * <EmptyState
 *   title="No discussions yet"
 *   description="Be the first to start a conversation."
 *   icon="MessageSquare"
 *   action={{ label: 'Start Discussion', href: '/new' }}
 * />
 *
 * @example
 * // Compact variant for smaller spaces
 * <EmptyState
 *   title="No results"
 *   description="Try adjusting your search."
 *   icon="SearchX"
 *   variant="compact"
 * />
 */
export function EmptyState({
  context,
  title,
  description,
  message,
  icon,
  action,
  secondaryAction,
  variant = 'page',
  size = 'md',
  className,
}: EmptyStateProps) {
  // Get content from context if provided
  const contextContent = context ? EMPTY_STATE_CONTENT[context] : null;

  const displayTitle = title ?? contextContent?.title ?? 'No content';
  const displayDescription = message ?? description ?? contextContent?.description;

  // Size-based styling
  const sizeStyles = {
    sm: { icon: 'h-4 w-4', iconWrapper: 'p-2', title: 'text-sm', desc: 'text-xs' },
    md: { icon: 'h-5 w-5', iconWrapper: 'p-3', title: 'text-base', desc: 'text-sm' },
    lg: { icon: 'h-8 w-8', iconWrapper: 'p-4', title: 'text-lg', desc: 'text-base' },
  };
  const sizeStyle = sizeStyles[size];
  const displayIcon = icon ?? contextContent?.icon;

  // Build action from context if not provided directly
  const displayAction = action ?? (
    contextContent && 'actionLabel' in contextContent && contextContent.actionLabel
      ? { label: contextContent.actionLabel }
      : undefined
  );

  const IconComponent = getIcon(displayIcon);

  const ActionButton = ({ action: a, isSecondary = false }: { action: EmptyStateAction; isSecondary?: boolean }) => {
    const buttonVariant = a.variant ?? (isSecondary ? 'outline' : 'default');

    if (a.href) {
      return (
        <Button variant={buttonVariant} asChild>
          <Link href={a.href}>{a.label}</Link>
        </Button>
      );
    }

    return (
      <Button type="button" variant={buttonVariant} onClick={a.onClick}>
        {a.label}
      </Button>
    );
  };

  // Inline variant (similar to compact but more subtle)
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-md bg-muted/50',
          className
        )}
      >
        {IconComponent && (
          <div className={cn('rounded-full bg-muted shrink-0', sizeStyle.iconWrapper)}>
            <IconComponent className={cn('text-muted-foreground', sizeStyle.icon)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium', sizeStyle.title)}>{displayTitle}</p>
          {displayDescription && (
            <p className={cn('text-muted-foreground', sizeStyle.desc)}>{displayDescription}</p>
          )}
        </div>
        {displayAction && <ActionButton action={displayAction} />}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border border-dashed',
          className
        )}
      >
        {IconComponent && (
          <div className={cn('rounded-full bg-muted shrink-0', sizeStyle.iconWrapper)}>
            <IconComponent className={cn('text-muted-foreground', sizeStyle.icon)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium', sizeStyle.title)}>{displayTitle}</p>
          {displayDescription && (
            <p className={cn('text-muted-foreground', sizeStyle.desc)}>{displayDescription}</p>
          )}
        </div>
        {displayAction && <ActionButton action={displayAction} />}
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed',
          className
        )}
      >
        {IconComponent && (
          <div className="rounded-full bg-muted p-4 mb-4">
            <IconComponent className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <h3 className="text-lg font-semibold mb-1">{displayTitle}</h3>
        {displayDescription && (
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {displayDescription}
          </p>
        )}
        {(displayAction || secondaryAction) && (
          <div className="flex gap-2 mt-2">
            {displayAction && <ActionButton action={displayAction} />}
            {secondaryAction && <ActionButton action={secondaryAction} isSecondary />}
          </div>
        )}
      </div>
    );
  }

  // Page variant (default)
  return (
    <div
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center',
        className
      )}
    >
      {IconComponent && (
        <div className="rounded-full bg-muted p-6">
          <IconComponent className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-semibold tracking-tight">{displayTitle}</h2>
        {displayDescription && (
          <p className="text-muted-foreground">{displayDescription}</p>
        )}
      </div>

      {(displayAction || secondaryAction) && (
        <div className="flex gap-3 mt-2">
          {displayAction && <ActionButton action={displayAction} />}
          {secondaryAction && <ActionButton action={secondaryAction} isSecondary />}
        </div>
      )}
    </div>
  );
}

/**
 * Compact empty state variant for smaller spaces
 */
export function EmptyStateCompact(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState {...props} variant="compact" />;
}

export default EmptyState;
