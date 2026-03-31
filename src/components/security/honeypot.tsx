'use client';

import { useRef, useEffect } from 'react';

import { logger } from '@/lib/logger';
const log = logger.scope('security/honeypot');

// Extracted outside component to prevent recreation on each render
const HONEYPOT_CONTAINER_STYLE = {
  position: 'absolute',
  left: '-9999px',
  top: '-9999px',
  opacity: 0,
  height: 0,
  width: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  zIndex: -1,
} as const;

interface HoneypotProps {
  fieldName?: string;
  onBotDetected?: () => void;
}

/**
 * Honeypot field component - invisible to users, bots fill it out
 *
 * Include in any public form to detect automated submissions.
 * Bots typically fill out all form fields, including hidden ones.
 *
 * @example
 * ```tsx
 * <form onSubmit={handleSubmit}>
 *   <Honeypot fieldName="website_url" onBotDetected={() => setIsBot(true)} />
 *   <input name="email" type="email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
export function Honeypot({
  fieldName = 'website_url',
  onBotDetected,
}: HoneypotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const checkHoneypot = () => {
      if (input.value) {
        log.warn('[SECURITY] Honeypot triggered - bot detected');
        onBotDetected?.();
      }
    };

    input.addEventListener('change', checkHoneypot);
    input.addEventListener('input', checkHoneypot);

    return () => {
      input.removeEventListener('change', checkHoneypot);
      input.removeEventListener('input', checkHoneypot);
    };
  }, [onBotDetected]);

  return (
    <div
      style={HONEYPOT_CONTAINER_STYLE}
      aria-hidden="true"
      tabIndex={-1}
    >
      <label htmlFor={fieldName}>Leave this field empty</label>
      <input
        ref={inputRef}
        type="text"
        id={fieldName}
        name={fieldName}
        autoComplete="off"
        tabIndex={-1}
      />
    </div>
  );
}

/**
 * Validate honeypot on form submission (server-side)
 *
 * @param formData - FormData from form submission
 * @param fieldName - Name of the honeypot field
 * @returns true if human (honeypot empty), false if bot detected
 *
 * @example
 * ```ts
 * export async function submitForm(formData: FormData) {
 *   if (!validateHoneypot(formData)) {
 *     return { error: 'Invalid submission' };
 *   }
 *   // Process legitimate submission...
 * }
 * ```
 */
export function validateHoneypot(
  formData: FormData,
  fieldName = 'website_url'
): boolean {
  const honeypotValue = formData.get(fieldName);

  if (honeypotValue && String(honeypotValue).trim() !== '') {
    log.warn('[SECURITY] Honeypot validation failed - bot detected');
    return false; // Bot detected
  }

  return true; // Human verified
}
