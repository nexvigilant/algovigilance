import { createMetadata } from '@/lib/metadata';
import { CommunityLayoutClient } from './community-layout-client';

export const metadata = createMetadata({
  title: 'Community',
  description: 'Connect with healthcare professionals transitioning to pharmaceutical careers.',
  path: '/nucleus/community',
});

/**
 * Community Layout (Server Component)
 *
 * Exports metadata and renders the client-side community layout logic.
 */
export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CommunityLayoutClient>{children}</CommunityLayoutClient>;
}
