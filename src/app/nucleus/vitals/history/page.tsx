import { createMetadata } from '@/lib/metadata';
import { HistoryDashboard } from './components/history-dashboard';

export const metadata = createMetadata({
  title: 'NexWatch History',
  description: 'Biometric trends — heart rate, HRV, and stress over 24h, 7d, and 30d.',
  path: '/nucleus/vitals/history',
});

export default function HistoryPage() {
  return <HistoryDashboard />;
}
