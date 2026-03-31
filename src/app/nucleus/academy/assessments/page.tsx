import { redirect } from 'next/navigation';

/**
 * Legacy /academy/assessments route - redirects to /careers/assessments
 *
 * Assessments have been moved to the Careers section where they better
 * align with professional development and career advancement tools.
 *
 * @deprecated Use /nucleus/careers/assessments instead
 */
export default function AssessmentsRedirectPage() {
  redirect('/nucleus/careers/assessments');
}
