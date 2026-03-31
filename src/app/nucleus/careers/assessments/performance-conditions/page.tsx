import { createMetadata } from '@/lib/metadata';
import { PerformanceConditionsClient } from './assessment-client';

export const metadata = createMetadata({
  title: 'High-Performance Conditions Map',
  description: 'Discover the work conditions under which you perform your best. Map your ideal environment, autonomy level, challenge preferences, and team dynamics for peak performance.',
  path: '/nucleus/careers/assessments/performance-conditions',
});

export default function PerformanceConditionsPage() {
  return <PerformanceConditionsClient />;
}
