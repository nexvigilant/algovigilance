'use client';

import { Suspense, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { LOADING_MESSAGES, type LoadingContext } from './constants';

/**
 * Loading fallback props
 */
export interface LoadingFallbackProps {
  /** Predefined context for automatic message generation */
  context?: LoadingContext;
  /** Visual variant */
  variant?: 'spinner' | 'skeleton' | 'fullpage' | 'inline';
  /** Custom loading message (overrides context) */
  message?: string;
  /** Whether to show the message */
  showMessage?: boolean;
  /** Size of spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * Loading fallback component with multiple variants
 *
 * @example
 * // Spinner (default)
 * <LoadingFallback message="Loading data..." />
 *
 * @example
 * // Full page
 * <LoadingFallback variant="fullpage" message="Preparing your experience..." />
 *
 * @example
 * // Inline in text
 * <LoadingFallback variant="inline" size="sm" />
 */
export function LoadingFallback({
  context = 'default',
  variant = 'spinner',
  message,
  showMessage = true,
  size = 'md',
  className,
}: LoadingFallbackProps) {
  const displayMessage = message ?? LOADING_MESSAGES[context];
  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        {showMessage && (
          <span className="text-muted-foreground text-sm">{displayMessage}</span>
        )}
      </span>
    );
  }

  if (variant === 'spinner') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 py-12',
          className
        )}
        role="status"
        aria-busy="true"
        aria-label={displayMessage}
      >
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {showMessage && (
          <p className="text-muted-foreground text-sm animate-pulse">
            {displayMessage}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'fullpage') {
    return (
      <div
        className={cn(
          'flex min-h-[50vh] flex-col items-center justify-center gap-6',
          className
        )}
        role="status"
        aria-busy="true"
        aria-label={displayMessage}
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        {showMessage && (
          <p className="text-muted-foreground animate-pulse">{displayMessage}</p>
        )}
      </div>
    );
  }

  // Skeleton variant
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-busy="true"
      aria-label={displayMessage}
    >
      {showMessage && (
        <p className="text-muted-foreground text-sm text-center animate-pulse">
          {displayMessage}
        </p>
      )}
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

/**
 * Loading overlay with message - overlays existing content
 */
export function LoadingOverlay({
  context = 'default',
  message,
  className,
}: Pick<LoadingFallbackProps, 'context' | 'message' | 'className'>) {
  const displayMessage = message ?? LOADING_MESSAGES[context];
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label={displayMessage}
    >
      <div className="flex flex-col items-center gap-3 bg-background/80 rounded-lg px-6 py-4 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">{displayMessage}</p>
      </div>
    </div>
  );
}

/**
 * Just the loading message - for adding to existing loading UI
 */
export function LoadingMessage({
  context = 'default',
  message,
  className,
}: Pick<LoadingFallbackProps, 'context' | 'message' | 'className'>) {
  const displayMessage = message ?? LOADING_MESSAGES[context];

  return (
    <p
      className={cn('text-muted-foreground text-sm text-center animate-pulse', className)}
      role="status"
      aria-live="polite"
    >
      {displayMessage}
    </p>
  );
}

/**
 * Loading Boundary props
 */
export interface LoadingBoundaryProps {
  children: ReactNode;
  /** Fallback to show while loading */
  fallback?: ReactNode;
  /** Predefined context for automatic message generation */
  context?: LoadingContext;
  /** Fallback variant if using default fallback */
  variant?: 'spinner' | 'skeleton' | 'fullpage' | 'inline';
  /** Custom loading message (overrides context) */
  message?: string;
  /** Additional className for fallback */
  className?: string;
}

/**
 * Loading Boundary - wraps children in Suspense with configurable fallback
 *
 * @example
 * // Basic usage
 * <LoadingBoundary message="Loading data...">
 *   <AsyncComponent />
 * </LoadingBoundary>
 *
 * @example
 * // Full page loading
 * <LoadingBoundary variant="fullpage" message="Preparing your experience...">
 *   <AsyncPage />
 * </LoadingBoundary>
 *
 * @example
 * // Custom fallback
 * <LoadingBoundary fallback={<CustomSkeleton />}>
 *   <AsyncComponent />
 * </LoadingBoundary>
 */
export function LoadingBoundary({
  children,
  fallback,
  context,
  variant = 'spinner',
  message,
  className,
}: LoadingBoundaryProps) {
  const fallbackElement = fallback ?? (
    <LoadingFallback
      context={context}
      variant={variant}
      message={message}
      className={className}
    />
  );

  return <Suspense fallback={fallbackElement}>{children}</Suspense>;
}

export default LoadingBoundary;
