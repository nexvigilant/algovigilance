'use client';

import { ErrorFallback } from '@/components/layout/boundaries/error-boundary';

interface ApiErrorStateProps {
  error: Error;
  onRetry: () => void;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Error state for API data loading failures. Delegates to the shared
 * ErrorFallback component with the "card" variant for a contained,
 * non-page-blocking error display with retry.
 */
export function ApiErrorState({
  error,
  onRetry,
  title = 'Unable to load data',
  description = 'The service may be temporarily unavailable. Please try again.',
  className,
}: ApiErrorStateProps) {
  return (
    <ErrorFallback
      error={error}
      resetError={onRetry}
      variant="card"
      title={title}
      description={description}
      className={className}
    />
  );
}
