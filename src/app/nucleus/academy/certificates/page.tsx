import { redirect } from 'next/navigation';

/**
 * Legacy /certificates route - redirects to /verifications
 *
 * @deprecated Use /nucleus/academy/verifications instead
 */
export default function CertificatesRedirectPage() {
  redirect('/nucleus/academy/verifications');
}
