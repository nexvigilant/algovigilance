import { createMetadata } from '@/lib/metadata';
import { VigilanceDashboard } from './components/vigilance-dashboard';

export const metadata = createMetadata({
  title: 'Vigilance Dashboard',
  description: 'System health, Guardian status, and operational metrics for pharmacovigilance monitoring',
  path: '/nucleus/vigilance/dashboard',
  keywords: ['vigilance', 'dashboard', 'guardian', 'system health', 'monitoring'],
});

export default function DashboardPage() {
  return <VigilanceDashboard />;
}
