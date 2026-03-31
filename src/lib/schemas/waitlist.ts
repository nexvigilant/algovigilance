/**
 * Waitlist Schema
 *
 * Zod validation schema for founding member waitlist signup.
 * Extracted for reuse and unit testing.
 */

import { z } from 'zod';

/**
 * Waitlist signup schema - simple email validation
 */
export const WaitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type WaitlistFormData = z.infer<typeof WaitlistSchema>;
