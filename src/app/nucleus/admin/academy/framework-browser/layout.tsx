import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'PDC Framework Browser',
  description: 'Browse Pharmacovigilance Professional Development Continuum - Domains, EPAs, and CPAs.',
  path: '/nucleus/admin/academy/framework-browser',
});

export default function FrameworkBrowserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
