import { createMetadata } from '@/lib/metadata';
import { SeverityAssessment } from './components/severity-assessment';

export const metadata = createMetadata({
  title: 'Severity Assessment',
  description: 'Grade adverse event intensity (mild/moderate/severe) — independent dimension from seriousness per ICH E2A',
  path: '/nucleus/vigilance/severity',
  keywords: ['severity', 'intensity', 'mild', 'moderate', 'severe', 'CTCAE', 'ICH E2A', 'pharmacovigilance'],
});

export default function SeverityPage() {
  return <SeverityAssessment />;
}
