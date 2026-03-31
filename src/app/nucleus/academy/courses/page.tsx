import { redirect } from 'next/navigation';

/**
 * Legacy /courses route - redirects to /pathways
 *
 * The /courses route has been deprecated in favor of /pathways
 * which provides EPA-focused capability pathway discovery.
 *
 * @deprecated Use /nucleus/academy/pathways instead
 */
export default function CoursesPage() {
  redirect('/nucleus/academy/pathways');
}
