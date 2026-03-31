import { createMetadata } from '@/lib/metadata';
import { VitalsDashboard } from './components/vitals-dashboard';

export const metadata = createMetadata({
  title: 'NexWatch',
  description: 'Real-time Galaxy Watch biometric monitoring — heart rate, HRV, stress, and activity.',
  path: '/nucleus/vitals',
});

export default function VitalsPage() {
  return <VitalsDashboard />;
}
