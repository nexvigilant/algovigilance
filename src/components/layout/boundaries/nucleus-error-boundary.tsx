'use client';

import { type ErrorInfo } from 'react';
import { Home, MessageSquare } from 'lucide-react';
import { ErrorBoundary, ErrorFallback, type ErrorFallbackProps } from './error-boundary';
import { ERROR_CONTENT, type ErrorType } from './constants';

/**
 * Nucleus-specific error fallback with navigation back to dashboard
 *
 * Uses the base ErrorFallback with Nucleus-specific actions:
 * - Back to Dashboard (/nucleus)
 * - Contact Support (/contact)
 */
function NucleusErrorFallback({
  error,
  resetError,
  title = 'Something Went Wrong',
  description = 'An unexpected issue occurred. Please try again or return to your dashboard.',
  showTechnicalDetails = process.env.NODE_ENV === 'development',
  className,
}: ErrorFallbackProps) {
  return (
    <ErrorFallback
      error={error}
      resetError={resetError}
      title={title}
      description={description}
      showTechnicalDetails={showTechnicalDetails}
      className={className}
      variant="page"
      action={{
        label: 'Back to Dashboard',
        href: '/nucleus',
        icon: Home,
      }}
      additionalActions={[
        {
          label: 'Contact Support',
          href: '/contact',
          icon: MessageSquare,
          variant: 'ghost',
        },
      ]}
    />
  );
}

/**
 * Nucleus Error Boundary - for use within the authenticated portal
 *
 * @example
 * // Wrap page content
 * <NucleusErrorBoundary>
 *   <PageContent />
 * </NucleusErrorBoundary>
 *
 * @example
 * // With error logging
 * <NucleusErrorBoundary
 *   onError={(error, info) => logErrorToService(error, info)}
 * >
 *   <PageContent />
 * </NucleusErrorBoundary>
 */
export function NucleusErrorBoundary({
  children,
  onError,
  onReset,
  title,
  description,
  className,
}: {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <ErrorBoundary
      onError={onError}
      onReset={onReset}
      fallback={(props) => (
        <NucleusErrorFallback
          {...props}
          title={title ?? props.title}
          description={description ?? props.description}
          className={className ?? props.className}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * For use in Next.js error.tsx files within Nucleus routes
 * This is a wrapper component, not a true Error Boundary (those must be class components)
 *
 * Compatible with VoiceErrorBoundary API for backwards compatibility
 */
export function NucleusErrorPage({
  error,
  reset,
  type = 'generic',
  title,
  description,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Error type for automatic messaging (backwards compatible with VoiceErrorBoundary) */
  type?: ErrorType;
  title?: string;
  description?: string;
}) {
  // Get content from type if title/description not provided
  const errorContent = ERROR_CONTENT[type];
  const displayTitle = title ?? errorContent.title;
  const displayDescription = description ?? errorContent.description;

  return (
    <div className="container mx-auto py-16">
      <ErrorFallback
        error={error}
        resetError={reset}
        type={type}
        title={displayTitle}
        description={displayDescription}
        variant="page"
        showTechnicalDetails={process.env.NODE_ENV === 'development'}
      />
    </div>
  );
}

export default NucleusErrorBoundary;
