import { createMetadata } from '@/lib/metadata';
import { SubscriptionClient } from './subscription-client';

export const metadata = createMetadata({
  title: 'Subscription',
  description: 'Manage your subscription and billing',
  path: '/nucleus/profile/subscription',
});

export default function SubscriptionPage() {
  return <SubscriptionClient />;
}
