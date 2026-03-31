import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Subscription Confirmed',
  description:
    'Your AlgoVigilance membership is confirmed. Welcome to the vigilance intelligence platform.',
  path: '/checkout/success',
  noIndex: true,
});

/**
 * CheckoutSuccessPage - Post-payment success confirmation
 *
 * WAITLIST MODE: Redirects to /membership
 *
 * POST-LAUNCH: Remove redirect and render SuccessClient:
 * ```tsx
 * import { SuccessClient } from './success-client';
 *
 * export default function CheckoutSuccessPage() {
 *   return <SuccessClient />;
 * }
 * ```
 *
 * Expected URL: /checkout/success?session_id={CHECKOUT_SESSION_ID}
 *
 * @see success-client.tsx for the full success flow implementation
 * @see /membership for current waitlist behavior
 */
export default function CheckoutSuccessPage() {
  redirect('/membership');
}
