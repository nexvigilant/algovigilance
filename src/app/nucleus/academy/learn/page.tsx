import { redirect } from 'next/navigation';

/**
 * Legacy /learn route - redirects to /pathways
 *
 * @deprecated Use /nucleus/academy/pathways instead
 */
export default function LearnRedirectPage() {
  redirect('/nucleus/academy/pathways');
}
