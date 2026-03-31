import { CertificatesClient } from './certificates-client';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'My Verifications',
  description: 'View and share your earned capability verifications.',
  path: '/nucleus/academy/verifications',
});

export default function VerificationsPage() {
  return <CertificatesClient />;
}
