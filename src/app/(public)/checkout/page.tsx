import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Checkout',
  description:
    'Complete your AlgoVigilance membership subscription. Secure checkout for vigilance professionals.',
  path: '/checkout',
  noIndex: true,
});

/**
 * CheckoutPage - Entry point for subscription checkout
 *
 * WAITLIST MODE: Redirects to /membership
 *
 * POST-LAUNCH: Remove redirect and render CheckoutClient:
 * ```tsx
 * import { CheckoutClient } from './checkout-client';
 *
 * export default function CheckoutPage() {
 *   return <CheckoutClient />;
 * }
 * ```
 *
 * @see checkout-client.tsx for the full checkout flow implementation
 * @see /membership for current waitlist behavior
 */
export default function CheckoutPage() {
  redirect('/membership');
}
