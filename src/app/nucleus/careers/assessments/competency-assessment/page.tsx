import { createMetadata } from '@/lib/metadata';
import { CompetencyAssessmentClient } from './assessment-client';

export const metadata = createMetadata({
  title: 'PV Competency Self-Assessment',
  description: 'Discover your vigilance competency level across 8 critical areas. Free 15-minute assessment with personalized report.',
  path: '/nucleus/careers/assessments/competency-assessment',
});

export default function CompetencyAssessmentPage() {
  return (
    <div className="min-h-screen bg-nex-surface">
      <CompetencyAssessmentClient />
    </div>
  );
}
