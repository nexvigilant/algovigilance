import { createMetadata } from '@/lib/metadata';
import ReviewQueueClient from './review-queue-client';

export const metadata = createMetadata({
  title: 'KSB Review Queue',
  description: 'Review and manage KSB content workflow',
  path: '/nucleus/admin/academy/ksb-builder/review',
});

export default function ReviewQueuePage() {
  return (
    <>
      <ReviewQueueClient />
    </>
  );
}
