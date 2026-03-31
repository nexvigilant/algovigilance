/**
 * Voice Components - DEPRECATED
 *
 * This module has been migrated to @/components/layout/boundaries
 * These re-exports are maintained for backwards compatibility.
 *
 * New code should import from '@/components/layout/boundaries' instead:
 *
 * @example
 * // OLD (deprecated)
 * import { VoiceLoading } from '@/components/voice';
 *
 * // NEW (recommended)
 * import { LoadingFallback } from '@/components/layout/boundaries';
 * // or use the Voice alias:
 * import { VoiceLoading } from '@/components/layout/boundaries';
 *
 * @deprecated Use '@/components/layout/boundaries' instead
 */

// Re-export everything from boundaries for backwards compatibility
export {
  // Loading components
  VoiceLoading,
  VoiceLoadingOverlay,
  VoiceLoadingMessage,
  type VoiceLoadingProps,

  // Error components
  VoiceError,
  VoiceErrorBoundary,
  type VoiceErrorProps,

  // Empty state components
  VoiceEmptyState,
  VoiceEmptyStateCompact,
  type VoiceEmptyStateProps,
  type VoiceEmptyStateAction,

  // Toast utilities
  voiceToast,
  customToast,

  // Constants
  LOADING_MESSAGES,
  EMPTY_STATE_CONTENT,
  ERROR_CONTENT,
  TOAST_MESSAGES,
  type LoadingContext,
  type EmptyStateContext,
  type ErrorType,
  type ToastContext,
} from '@/components/layout/boundaries';
