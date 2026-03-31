import { createMetadata } from '@/lib/metadata';
import { MaturityModelClient } from './assessment-client';

export const metadata = createMetadata({
  title: 'PV Maturity Model Assessment',
  description: 'Assess your organization\'s vigilance program maturity level. Get strategic recommendations and ROI analysis for advancing across 5 dimensions.',
  path: '/nucleus/careers/assessments/maturity-model',
});

export default function MaturityModelPage() {
  return (
    <div className="min-h-screen bg-nex-surface">
      <MaturityModelClient />
    </div>
  );
}
