import { toast } from '@/hooks/use-toast';
import { TOAST_MESSAGES, type ToastContext } from './constants';

/**
 * Brand-aligned toast utility with predefined messages.
 * Routes all toasts through the shadcn/Radix toast system.
 *
 * @example
 * // Use predefined message
 * voiceToast.success('save');
 * voiceToast.error('network');
 *
 * @example
 * // Custom message fallback
 * voiceToast.success('custom', 'Your custom success message');
 */
export const voiceToast = {
  success: (context: ToastContext | 'custom', customMessage?: string) => {
    const message =
      customMessage ??
      (context !== 'custom' && TOAST_MESSAGES[context]
        ? 'success' in TOAST_MESSAGES[context]
          ? TOAST_MESSAGES[context].success
          : undefined
        : undefined) ??
      'Success';

    return toast({ title: message as string, variant: 'success' });
  },

  error: (context: ToastContext | 'custom', customMessage?: string) => {
    const message =
      customMessage ??
      (context !== 'custom' && TOAST_MESSAGES[context]
        ? 'error' in TOAST_MESSAGES[context]
          ? TOAST_MESSAGES[context].error
          : undefined
        : undefined) ??
      'An error occurred';

    return toast({ title: message as string, variant: 'destructive' });
  },

  info: (message: string) => toast({ title: message, variant: 'info' }),
  warning: (message: string) => toast({ title: message, variant: 'warning' }),
};

/**
 * Custom toast for non-predefined messages.
 * Routes all toasts through the shadcn/Radix toast system.
 *
 * @example
 * customToast.success('Custom message here');
 * customToast.error('Custom error message');
 */
export const customToast = {
  success: (message: string) => toast({ title: message, variant: 'success' }),
  error: (message: string) => toast({ title: message, variant: 'destructive' }),
  info: (message: string) => toast({ title: message, variant: 'info' }),
  warning: (message: string) => toast({ title: message, variant: 'warning' }),
};

export default voiceToast;
