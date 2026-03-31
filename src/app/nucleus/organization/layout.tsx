import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Organization',
  description: 'Manage your research organization, programs, and team.',
  path: '/nucleus/organization',
});

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
