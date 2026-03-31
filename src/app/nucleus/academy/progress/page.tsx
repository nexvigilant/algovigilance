import { ProgressClient } from './progress-client';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'My Progress',
  description: 'Track your learning journey and achievements.',
  path: '/nucleus/academy/progress',
});

export default function ProgressPage() {
  return <ProgressClient />;
}
