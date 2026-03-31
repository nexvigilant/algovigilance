/**
 * Boundary Components - Error handling, loading states, empty states, and toasts
 *
 * These components provide consistent UI for common application states:
 * - Error boundaries for catching JavaScript errors
 * - Loading boundaries for async content
 * - Empty states for when there's no content
 * - Toast utilities for notifications
 *
 * @example
 * // Error boundary
 * import { ErrorBoundary } from '@/components/layout/boundaries';
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * // Loading with context
 * import { LoadingFallback } from '@/components/layout/boundaries';
 * <LoadingFallback context="academy" />
 *
 * @example
 * // Empty state with context
 * import { EmptyState } from '@/components/layout/boundaries';
 * <EmptyState context="posts" />
 *
 * @example
 * // Toast notification
 * import { voiceToast } from '@/components/layout/boundaries';
 * voiceToast.success('save');
 */

// Constants
export {
  LOADING_MESSAGES,
  EMPTY_STATE_CONTENT,
  ERROR_CONTENT,
  TOAST_MESSAGES,
  type LoadingContext,
  type EmptyStateContext,
  type ErrorType,
  type ToastContext,
} from './constants';

// Error Boundary
export {
  ErrorBoundary,
  ErrorFallback,
  type ErrorBoundaryProps,
  type ErrorFallbackProps,
} from './error-boundary';

// Loading Boundary
export {
  LoadingBoundary,
  LoadingFallback,
  LoadingOverlay,
  LoadingMessage,
  type LoadingBoundaryProps,
  type LoadingFallbackProps,
} from './loading-boundary';

// Empty State
export {
  EmptyState,
  EmptyStateCompact,
  type EmptyStateProps,
  type EmptyStateAction,
} from './empty-state';

// Nucleus-specific
export {
  NucleusErrorBoundary,
  NucleusErrorPage,
} from './nucleus-error-boundary';

// Toast utilities
export { voiceToast, customToast } from './toast-utils';

// ============================================================================
// Voice-compatible aliases (for backwards compatibility during migration)
// ============================================================================

// VoiceLoading → LoadingFallback
export { LoadingFallback as VoiceLoading } from './loading-boundary';
export { LoadingOverlay as VoiceLoadingOverlay } from './loading-boundary';
export { LoadingMessage as VoiceLoadingMessage } from './loading-boundary';
export type { LoadingFallbackProps as VoiceLoadingProps } from './loading-boundary';

// VoiceError → ErrorFallback
export { ErrorFallback as VoiceError } from './error-boundary';
export type { ErrorFallbackProps as VoiceErrorProps } from './error-boundary';

// VoiceErrorBoundary → NucleusErrorPage (for error.tsx files)
export { NucleusErrorPage as VoiceErrorBoundary } from './nucleus-error-boundary';

// VoiceEmptyState → EmptyState
export { EmptyState as VoiceEmptyState } from './empty-state';
export { EmptyStateCompact as VoiceEmptyStateCompact } from './empty-state';
export type { EmptyStateProps as VoiceEmptyStateProps } from './empty-state';
export type { EmptyStateAction as VoiceEmptyStateAction } from './empty-state';
