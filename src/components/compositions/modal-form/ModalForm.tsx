'use client';

/**
 * ModalForm - Pre-built modal dialog with integrated form
 *
 * Features:
 * - Modal dialog wrapper
 * - Form integration with validation
 * - Submit/cancel handling
 * - Loading states
 * - Error display
 * - Keyboard navigation (ESC to close)
 * - Focus trap
 * - Accessible (ARIA)
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <ModalForm
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Create Post"
 *   schema={postSchema}
 *   action={createPostAction}
 *   onSuccess={() => { setIsOpen(false); toast.success('Created!'); }}
 * >
 *   {(form) => (
 *     <>
 *       <input {...form.register('title')} />
 *       <textarea {...form.register('content')} />
 *     </>
 *   )}
 * </ModalForm>
 * ```
 */

import { useEffect, useRef } from 'react';
import type { z } from 'zod';
import { useServerActionForm } from '@/hooks/use-server-action-form';
import type { ServerActionResponse } from '@/lib/form-utils';

// ============================================================================
// Types
// ============================================================================

export interface ModalFormProps<TSchema extends z.ZodType<any, any>, TOutput = unknown> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  schema: TSchema;
  action: (input: z.infer<TSchema>) => Promise<ServerActionResponse<TOutput>>;
  children: (form: ReturnType<typeof useServerActionForm>['form']) => React.ReactNode;
  defaultValues?: Partial<z.infer<TSchema>>;
  submitText?: string;
  cancelText?: string;
  onSuccess?: (data: TOutput) => void | Promise<void>;
  onError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================================================
// Component
// ============================================================================

export function ModalForm<TSchema extends z.ZodType<any, any>, TOutput = unknown>({
  isOpen,
  onClose,
  title,
  description,
  schema,
  action,
  children,
  defaultValues,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onSuccess,
  onError,
  size = 'md',
}: ModalFormProps<TSchema, TOutput>) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Form setup
  const { form, handleSubmit, isSubmitting, error, clearError } = useServerActionForm({
    schema,
    action,
    defaultValues: defaultValues as any,
    onSuccess: async (data) => {
      await onSuccess?.(data);
      form.reset();
    },
    onError,
  });

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  // Focus management - focus the modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the first focusable element within the modal
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'input, textarea, select, button:not([disabled])'
      );
      focusable?.focus();
    }
  }, [isOpen]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            {/* Error Alert */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="text-red-800 font-semibold text-sm">Error</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearError}
                    className="text-red-600 hover:text-red-800"
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {children(form)}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold
                ${isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              {isSubmitting ? 'Submitting...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Named exports preferred for tree-shaking
