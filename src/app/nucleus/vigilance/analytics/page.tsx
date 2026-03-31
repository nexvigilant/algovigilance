import { createMetadata } from '@/lib/metadata';
import { SignalAnalytics } from './components/signal-analytics';

export const metadata = createMetadata({
  title: 'Signal Analytics',
  description: 'Advanced PV analytics — signal velocity, geographic divergence, seriousness cascade, reporter-weighted disproportionality',
  path: '/nucleus/vigilance/analytics',
  keywords: ['signal analytics', 'pharmacovigilance', 'signal velocity', 'geographic divergence'],
});

export default function AnalyticsPage() {
  return <SignalAnalytics />;
}
