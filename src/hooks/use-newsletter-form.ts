'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { submitNewsletter } from '@/components/intelligence/actions';
import { TIMING } from '@/lib/constants/timing';

import { logger } from '@/lib/logger';
const log = logger.scope('hooks/use-newsletter-form');

type TimeoutId = ReturnType<typeof setTimeout>;

export type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseNewsletterFormOptions {
  /** Source identifier for analytics (e.g., 'site_footer', 'intelligence_hub') */
  source: string;
  /** Time in ms before success state resets to idle (default: 5000) */
  successResetDelay?: number;
}

export interface UseNewsletterFormReturn {
  /** Current email input value */
  email: string;
  /** Update email value */
  setEmail: (email: string) => void;
  /** Current form status */
  status: NewsletterStatus;
  /** Error or success message */
  message: string | null;
  /** Whether honeypot detected a bot */
  isBotDetected: boolean;
  /** Callback for honeypot component */
  onBotDetected: () => void;
  /** Submit handler for form onSubmit */
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  /** Whether form was successfully submitted */
  isSuccess: boolean;
  /** Whether form has an error */
  isError: boolean;
}

/**
 * Hook for newsletter subscription form logic.
 * Handles state, honeypot protection, submission, and success/error states.
 *
 * @example
 * const { email, setEmail, status, handleSubmit, message } = useNewsletterForm({
 *   source: 'site_footer',
 * });
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     <Honeypot onBotDetected={onBotDetected} />
 *     <input value={email} onChange={(e) => setEmail(e.target.value)} />
 *     <button disabled={status === 'loading'}>Subscribe</button>
 *   </form>
 * );
 */
export function useNewsletterForm({
  source,
  successResetDelay = TIMING.toastDuration,
}: UseNewsletterFormOptions): UseNewsletterFormReturn {

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<NewsletterStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [isBotDetected, setIsBotDetected] = useState(false);

  // Track active timeouts for cleanup on unmount
  const timeoutRefs = useRef<Set<TimeoutId>>(new Set());

  // Cleanup timeouts on unmount to prevent setState on unmounted component
  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
    };
  }, []);

  // Helper to schedule a timeout that auto-cleans from the set
  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutRefs.current.delete(id);
      callback();
    }, delay);
    timeoutRefs.current.add(id);
    return id;
  }, []);

  const onBotDetected = useCallback(() => {
    setIsBotDetected(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Honeypot protection: silently reject if bot detected
    if (isBotDetected) {
      log.warn('[SECURITY] Form submission blocked by honeypot', { source });
      // Show fake success to not reveal detection
      setStatus('success');
      setEmail('');
      scheduleTimeout(() => setStatus('idle'), successResetDelay);
      return;
    }

    if (!email) return;

    setStatus('loading');

        try {

          const result = await submitNewsletter({ email, source: source as 'site_footer' | 'intelligence_hub' | 'other' });

          

          if (result.success) {

    
        log.debug('Newsletter signup successful', { source });
        setStatus('success');
        setMessage(result.message);
        setEmail('');
        // Reset success state after delay
        scheduleTimeout(() => {
          setStatus('idle');
          setMessage(null);
        }, successResetDelay);
      } else {
        setStatus('error');
        setMessage(result.message);
        log.warn('Newsletter signup failed:', result.message);
      }
    } catch (err) {
      log.error('Newsletter signup error:', err);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }, [email, isBotDetected, source, successResetDelay, scheduleTimeout]);

  return {
    email,
    setEmail,
    status,
    message,
    isBotDetected,
    onBotDetected,
    handleSubmit,
    isSubmitting: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
}
