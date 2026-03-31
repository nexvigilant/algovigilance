import { redirect } from 'next/navigation';

/**
 * Legacy /courses/[id] route - redirects to /pathways
 *
 * The /courses/[id] route has been deprecated in favor of /pathways
 * which provides EPA-focused capability pathway discovery.
 *
 * Note: Courses and EPAs use different ID schemes with no direct mapping.
 * All course detail requests redirect to the pathways index.
 *
 * @deprecated Use /nucleus/academy/pathways instead
 */
export default function CourseDetailPage() {
  redirect('/nucleus/academy/pathways');
}
