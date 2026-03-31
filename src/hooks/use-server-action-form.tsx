/**
 * useServerActionForm Hook
 *
 * Integrates React Hook Form with Next.js server actions, providing
 * type-safe form handling with Zod validation and automatic error handling.
 *
 * Migrated from infrastructure/hooks/use-server-action-form.tsx
 *
 * @example
 * ```tsx
 * 'use client';
 *
 * import { z } from 'zod';
 * import { useServerActionForm } from '@/hooks/use-server-action-form';
 *
 * const schema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8)
 * });
 *
 * export function LoginForm() {
 *   const { form, handleSubmit, isSubmitting, error } = useServerActionForm({
 *     schema,
 *     action: loginAction,
 *     onSuccess: () => router.push('/nucleus')
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div className="error">{error}</div>}
 *       <input {...form.register('email')} />
 *       <button disabled={isSubmitting}>Sign In</button>
 *     </form>
 *   );
 * }
 * ```
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import type { z } from 'zod';
import type { UseFormProps, UseFormReturn } from 'react-hook-form';
import type { ServerActionResponse } from '@/lib/form-utils';

// ============================================================================
// Types
// ============================================================================

export interface ServerActionFormConfig<
  TSchema extends z.ZodTypeAny,
  TOutput = unknown
> {
  /**
   * Zod schema for form validation
   */
  schema: TSchema;

  /**
   * Server action to call on form submission
   */
  action: (input: z.infer<TSchema>) => Promise<ServerActionResponse<TOutput>>;

  /**
   * Default form values
   */
  defaultValues?: Partial<z.infer<TSchema>>;

  /**
   * Validation mode
   * @default 'onBlur'
   */
  mode?: UseFormProps<z.infer<TSchema>>['mode'];

  /**
   * Callback on successful submission
   */
  onSuccess?: (data: TOutput) => void | Promise<void>;

  /**
   * Callback on error
   */
  onError?: (error: string) => void;

  /**
   * Whether to reset form after successful submission
   * @default false
   */
  resetOnSuccess?: boolean;
}

export interface ServerActionFormReturn<TSchema extends z.ZodTypeAny> {
  /**
   * React Hook Form instance
   */
  form: UseFormReturn<z.infer<TSchema>>;

  /**
   * Form submission handler
   */
  handleSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;

  /**
   * Whether form is currently submitting
   */
  isSubmitting: boolean;

  /**
   * Server-side error message (if any)
   */
  error: string | null;

  /**
   * Field-specific errors from server
   */
  fieldErrors: Record<string, string> | null;

  /**
   * Manually clear errors
   */
  clearError: () => void;

  /**
   * Reset form to default values
   */
  reset: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for handling forms with server actions
 *
 * Features:
 * - Zod schema validation
 * - Type-safe form data
 * - Automatic error handling (client & server)
 * - Loading state management
 * - Field-level error mapping
 * - Success/error callbacks
 * - Form reset on success
 *
 * @param config - Configuration options
 * @returns Form utilities and state
 */
export function useServerActionForm<
  TSchema extends z.ZodTypeAny,
  TOutput = unknown
>(
  config: ServerActionFormConfig<TSchema, TOutput>
): ServerActionFormReturn<TSchema> {
  const {
    schema,
    action,
    defaultValues,
    mode = 'onBlur',
    onSuccess,
    onError,
    resetOnSuccess = false,
  } = config;

  // Form state
  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<TSchema>,
    mode,
  });

  // Server error state
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [pending, setPending] = useState(false);

  // Submission handler
  const handleSubmit = form.handleSubmit(async (data) => {
    // Clear previous errors
    setError(null);
    setFieldErrors(null);

    setPending(true);
    try {
      const response = await action(data);

      if (response.success) {
        if (resetOnSuccess) {
          form.reset();
        }

        if (onSuccess && response.data !== undefined) {
          await onSuccess(response.data);
        }
      } else {
        if (response.errors) {
          setFieldErrors(response.errors);

          Object.entries(response.errors).forEach(([field, message]) => {
            form.setError(field as Parameters<typeof form.setError>[0], {
              type: 'server',
              message,
            });
          });
        }

        if (response.error) {
          setError(response.error);
          onError?.(response.error);
        }
      }
    } catch (err) {
      // Unexpected client-side error
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      onError?.(message);
    } finally {
      setPending(false);
    }
  });

  // Clear error helper
  const clearError = () => {
    setError(null);
    setFieldErrors(null);
  };

  // Reset helper
  const reset = () => {
    form.reset();
    clearError();
  };

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting || pending,
    error,
    fieldErrors,
    clearError,
    reset,
  };
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Simple hook for calling server actions without a form
 *
 * @example
 * ```tsx
 * const { execute, loading, error } = useServerAction(deletePostAction);
 *
 * const handleDelete = () => {
 *   execute({ postId: '123' });
 * };
 * ```
 */
export function useServerAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ServerActionResponse<TOutput>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TOutput | null>(null);

  const execute = async (input: TInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await action(input);

      if (response.success && response.data !== undefined) {
        setData(response.data);
        return response.data;
      } else if (response.error) {
        setError(response.error);
        throw new Error(response.error);
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setData(null);
  };

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
}
