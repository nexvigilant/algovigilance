import { createMetadata } from '@/lib/metadata';
import { SafetyReporting } from './components/safety-reporting';

export const metadata = createMetadata({
  title: 'Safety Reporting',
  description: 'Generate and manage safety reports — signal summaries, audit trails, and guardian performance documentation',
  path: '/nucleus/vigilance/reporting',
  keywords: ['safety reporting', 'pharmacovigilance', 'signal summary', 'audit trail'],
});

export default function ReportingPage() {
  return <SafetyReporting />;
}
