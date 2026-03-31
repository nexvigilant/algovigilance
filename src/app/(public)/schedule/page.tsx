import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { EXTERNAL_LINKS } from '@/data/consulting';

export const metadata = createMetadata({
  title: 'Schedule a Call',
  description:
    'Book a confidential discovery session with AlgoVigilance. Discuss your strategic vigilance challenges with our experts.',
  path: '/schedule',
});

/**
 * Schedule Page
 *
 * Redirects to external calendar while keeping the user within the
 * AlgoVigilance brand ecosystem. This approach enables:
 * - Better conversion tracking (we see the /schedule hit)
 * - Consistent branding before external redirect
 * - Easy link updates without touching multiple pages
 */
export default function SchedulePage() {
  // Server-side redirect to external calendar
  redirect(EXTERNAL_LINKS.calendar);
}
