/**
 * Form Utilities
 *
 * Utilities for building forms with validation, including React Hook Form
 * and Zod validation plus server action integration.
 *
 * Migrated from infrastructure/builders/form-builder.ts
 */

import type { z } from 'zod';
import type { UseFormProps, UseFormReturn, FieldValues, Path } from 'react-hook-form';

// ============================================================================
// Types
// ============================================================================

import type { ActionResponse } from '@/types/actions';

/** @deprecated Use ActionResponse from @/types/actions */
export type ServerActionResponse<T = unknown> = ActionResponse<T>;

export interface FormConfig<TFieldValues extends FieldValues> {
  schema: z.ZodType<TFieldValues>;
  defaultValues?: Partial<TFieldValues>;
  mode?: UseFormProps<TFieldValues>['mode'];
  onSuccess?: (data: TFieldValues) => void | Promise<void>;
  onError?: (error: string) => void;
}

// ============================================================================
// Server Action Helpers
// ============================================================================

/**
 * Wraps a server action with type-safe error handling
 *
 * @param action - Server action function
 * @returns Wrapped action with standardized response format
 *
 * @example
 * ```tsx
 * 'use server';
 *
 * import { wrapServerAction } from '@/lib/form-utils';
 *
 * export const createPost = wrapServerAction(async (data: PostData) => {
 *   const post = await db.posts.create(data);
 *   return post;
 * });
 * ```
 */
export function wrapServerAction<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
  { logger = console }: { logger?: Pick<Console, 'error'> } = {}
) {
  return async (input: TInput): Promise<ServerActionResponse<TOutput>> => {
    try {
      const data = await action(input);
      return { success: true, data };
    } catch (error) {
      logger.error('Server action error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }

      return { success: false, error: 'An unexpected error occurred' };
    }
  };
}

/**
 * Wraps a server action with Zod validation
 *
 * @param schema - Zod schema for validation
 * @param action - Server action function
 * @returns Validated and wrapped action
 *
 * @example
 * ```tsx
 * 'use server';
 *
 * import { z } from 'zod';
 * import { wrapValidatedAction } from '@/lib/form-utils';
 *
 * const postSchema = z.object({
 *   title: z.string().min(1),
 *   content: z.string().min(10)
 * });
 *
 * export const createPost = wrapValidatedAction(postSchema, async (data) => {
 *   // data is fully typed and validated
 *   const post = await db.posts.create(data);
 *   return post;
 * });
 * ```
 */
export function wrapValidatedAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  action: (input: TInput) => Promise<TOutput>,
  { logger = console }: { logger?: Pick<Console, 'error'> } = {}
) {
  return async (input: unknown): Promise<ServerActionResponse<TOutput>> => {
    try {
      // Validate input
      const validationResult = schema.safeParse(input);

      if (!validationResult.success) {
        const errors = validationResult.error.flatten().fieldErrors as Record<string, string[] | undefined>;
        const errorMessages: Record<string, string> = {};

        for (const [field, messages] of Object.entries(errors)) {
          if (Array.isArray(messages) && messages.length > 0) {
            errorMessages[field] = messages[0];
          }
        }

        return {
          success: false,
          error: 'Validation failed',
          errors: errorMessages
        };
      }

      // Execute action with validated data
      const data = await action(validationResult.data);
      return { success: true, data };

    } catch (error) {
      logger.error('Server action error:', error);

      if (error instanceof Error) {
        return { success: false, error: error.message };
      }

      return { success: false, error: 'An unexpected error occurred' };
    }
  };
}

// ============================================================================
// Form Field Error Helper
// ============================================================================

/**
 * Gets error message for a form field
 *
 * @param form - React Hook Form instance
 * @param fieldName - Field name
 * @returns Error message or undefined
 */
export function getFieldError<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  fieldName: Path<TFieldValues>
): string | undefined {
  const error = form.formState.errors[fieldName];
  return error?.message as string | undefined;
}

/**
 * Checks if a field has an error
 *
 * @param form - React Hook Form instance
 * @param fieldName - Field name
 * @returns True if field has error
 */
export function hasFieldError<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  fieldName: Path<TFieldValues>
): boolean {
  return !!form.formState.errors[fieldName];
}

// ============================================================================
// Loading State Helpers
// ============================================================================

/**
 * Checks if form is submitting or validating
 */
export function isFormBusy<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>
): boolean {
  return form.formState.isSubmitting || form.formState.isValidating;
}

/**
 * Gets form submit button props (disabled state, loading text)
 */
export function getSubmitButtonProps<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  { defaultText = 'Submit', loadingText = 'Submitting...' } = {}
) {
  const isBusy = isFormBusy(form);

  return {
    disabled: isBusy || !form.formState.isValid,
    children: isBusy ? loadingText : defaultText,
  };
}
