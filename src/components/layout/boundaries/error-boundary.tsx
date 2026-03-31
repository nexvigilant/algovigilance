"use client";

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import Link from "next/link";

import { logger } from "@/lib/logger";
import { captureError } from "@/lib/error-tracking";
const log = logger.scope("components/error-boundary");
import {
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  SearchX,
  ShieldX,
  WifiOff,
  Server,
  BookX,
  FileX,
  Lock,
  Sparkles,
  BarChart3,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ERROR_CONTENT, type ErrorType } from "./constants";

// Map of error icons - only import what we need
const ERROR_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  AlertTriangle,
  AlertCircle,
  SearchX,
  ShieldX,
  WifiOff,
  Server,
  BookX,
  FileX,
  Lock,
  Sparkles,
  BarChart3,
  Database,
};

function getIcon(
  iconName?: string,
): React.ComponentType<{ className?: string }> | null {
  if (!iconName) return null;
  return ERROR_ICONS[iconName] || null;
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  error?: Error | null;
  /** Reset/retry function - either resetError or onRetry must be provided */
  resetError?: () => void;
  /** Alias for resetError (backwards compatibility) */
  onRetry?: () => void;
  /** Error type for automatic messaging */
  type?: ErrorType;
  /** Alias for type (for backwards compatibility) */
  context?: ErrorType;
  /** Custom title (overrides type) */
  title?: string;
  /** Custom description (overrides type) */
  description?: string;
  /** Alias for description (for backwards compatibility) */
  message?: string;
  showTechnicalDetails?: boolean;
  variant?: "page" | "card" | "inline" | "alert";
  className?: string;
  /** Primary action */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
  };
  /** Additional actions (rendered as secondary buttons) */
  additionalActions?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: "outline" | "ghost" | "secondary";
  }>;
}

/**
 * Default error fallback component
 * Used by ErrorBoundary when no custom fallback is provided
 */
export function ErrorFallback({
  error,
  resetError,
  onRetry,
  type = "generic",
  context,
  title,
  description,
  message,
  showTechnicalDetails = process.env.NODE_ENV === "development",
  variant = "page",
  className,
  action,
  additionalActions,
}: ErrorFallbackProps) {
  // Handle aliases (onRetry is alias for resetError)
  const handleReset = resetError ?? onRetry ?? (() => {});
  // Get content from type (context is alias for type)
  const effectiveType = context ?? type;
  const errorContent = ERROR_CONTENT[effectiveType];

  const displayTitle = title ?? errorContent.title;
  const displayDescription = message ?? description ?? errorContent.description;
  const iconName = errorContent.icon;
  const defaultAction =
    action ??
    ("actionLabel" in errorContent && errorContent.actionLabel
      ? {
          label: errorContent.actionLabel,
          href:
            "actionHref" in errorContent ? errorContent.actionHref : undefined,
        }
      : undefined);

  const IconComponent = getIcon(iconName) ?? AlertTriangle;

  // Alert variant
  if (variant === "alert") {
    return (
      <div
        className={cn(
          "border border-destructive/50 bg-destructive/10 rounded-lg p-4",
          className,
        )}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <IconComponent className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-destructive">
              {displayTitle}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {displayDescription}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5",
          className,
        )}
      >
        <IconComponent className="h-5 w-5 text-destructive/70 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">{displayTitle}</p>
          <p className="text-xs text-muted-foreground">{displayDescription}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleReset}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/20 bg-card p-6 text-center",
          className,
        )}
      >
        <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-4 w-fit">
          <IconComponent className="h-8 w-8 text-destructive/70" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{displayTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {displayDescription}
        </p>
        {showTechnicalDetails && error && (
          <details className="text-left mb-4">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs bg-muted/50 p-2 rounded overflow-auto max-h-24">
              {error.message}
            </pre>
          </details>
        )}
        <div className="flex justify-center gap-2">
          <Button type="button" onClick={handleReset} size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Try Again
          </Button>
          {defaultAction?.href && (
            <Button variant="outline" size="sm" asChild>
              <Link href={defaultAction.href}>{defaultAction.label}</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Page variant (default)
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4",
        className,
      )}
    >
      <div className="rounded-full bg-destructive/10 p-6">
        <IconComponent className="h-16 w-16 text-destructive/70" />
      </div>

      <div className="text-center space-y-2 max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
        <p className="text-muted-foreground">{displayDescription}</p>

        {showTechnicalDetails && error && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Technical Details
            </summary>
            <pre className="mt-2 text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        {defaultAction && (
          <Button
            type={defaultAction.href ? undefined : "button"}
            variant="outline"
            asChild={!!defaultAction.href}
            onClick={defaultAction.onClick}
          >
            {defaultAction.href ? (
              <Link href={defaultAction.href}>
                {defaultAction.icon && (
                  <defaultAction.icon className="h-4 w-4 mr-2" />
                )}
                {defaultAction.label}
              </Link>
            ) : (
              <>
                {defaultAction.icon && (
                  <defaultAction.icon className="h-4 w-4 mr-2" />
                )}
                {defaultAction.label}
              </>
            )}
          </Button>
        )}
        {additionalActions?.map((action, index) => (
          <Button
            key={index}
            type={action.href ? undefined : "button"}
            variant={action.variant ?? "ghost"}
            asChild={!!action.href}
            onClick={action.onClick}
          >
            {action.href ? (
              <Link href={action.href}>
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Link>
            ) : (
              <>
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Error Boundary props
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component or render function */
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called when the error is reset */
  onReset?: () => void;
  /** Fallback variant if using default fallback */
  variant?: "page" | "card" | "inline";
  /** Custom title for default fallback */
  title?: string;
  /** Custom description for default fallback */
  description?: string;
  /** Additional className for the fallback */
  className?: string;
  /** Maximum retry attempts before showing persistent error (default: 3) */
  maxRetries?: number;
  /** Minimum time between retries in ms (default: 1000) */
  retryDebounceMs?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  lastRetryTime: number;
  maxRetriesExceeded: boolean;
}

/**
 * React Error Boundary - catches JavaScript errors in child components
 *
 * @example
 * // Basic usage with default fallback
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // Custom fallback component
 * <ErrorBoundary
 *   fallback={({ error, resetError }) => (
 *     <div>
 *       <p>Error: {error.message}</p>
 *       <button onClick={resetError}>Retry</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // Card variant for component-level errors
 * <ErrorBoundary variant="card" title="Unable to load data">
 *   <DataComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      lastRetryTime: 0,
      maxRetriesExceeded: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    log.error("ErrorBoundary caught an error:", { error, errorInfo });

    // Send to error tracking (Sentry when configured, local logging always)
    captureError(error, {
      tags: {
        component:
          errorInfo.componentStack?.split("\n")[1]?.trim() ?? "unknown",
      },
      extra: { componentStack: errorInfo.componentStack },
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    const { maxRetries = 3, retryDebounceMs = 1000 } = this.props;
    const { retryCount, lastRetryTime, maxRetriesExceeded } = this.state;
    const now = Date.now();

    // If max retries exceeded, don't allow more retries
    if (maxRetriesExceeded) {
      return;
    }

    // Debounce rapid retry clicks
    if (now - lastRetryTime < retryDebounceMs) {
      return;
    }

    const newRetryCount = retryCount + 1;

    // Check if we've exceeded max retries
    if (newRetryCount >= maxRetries) {
      this.setState({
        maxRetriesExceeded: true,
        lastRetryTime: now,
      });
      return;
    }

    // Proceed with retry
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      retryCount: newRetryCount,
      lastRetryTime: now,
    });
  };

  render(): ReactNode {
    const { hasError, error, maxRetriesExceeded, retryCount } = this.state;
    const {
      children,
      fallback,
      variant,
      title,
      description,
      className,
      maxRetries = 3,
    } = this.props;

    if (hasError && error) {
      // Modify title/description if max retries exceeded
      const effectiveTitle = maxRetriesExceeded ? "Unable to Recover" : title;
      const effectiveDescription = maxRetriesExceeded
        ? "This issue persists after multiple attempts. Please refresh the page or contact support if the problem continues."
        : description;

      // Custom fallback provided
      if (fallback) {
        if (typeof fallback === "function") {
          return fallback({
            error,
            resetError: maxRetriesExceeded ? undefined : this.resetError,
            variant,
            title: effectiveTitle,
            description: effectiveDescription,
            className,
          });
        }
        return fallback;
      }

      // Default fallback with retry info
      return (
        <ErrorFallback
          error={error}
          resetError={maxRetriesExceeded ? undefined : this.resetError}
          variant={variant}
          title={effectiveTitle}
          description={
            effectiveDescription ||
            (retryCount > 0 && !maxRetriesExceeded
              ? `Attempt ${retryCount + 1} of ${maxRetries}. Click retry to try again.`
              : undefined)
          }
          className={className}
          action={
            maxRetriesExceeded
              ? {
                  label: "Refresh Page",
                  onClick: () => window.location.reload(),
                }
              : undefined
          }
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
