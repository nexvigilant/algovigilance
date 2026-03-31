import { createMetadata } from '@/lib/metadata';
import { CommunityPageContent } from './community-content';

export const metadata = createMetadata({
  title: 'Community',
  description:
    'Connect with vigilance professionals who share your commitment to patient safety and independent practice.',
  path: '/community',
});

export default function CommunityPage() {
  return <CommunityPageContent />;
}
