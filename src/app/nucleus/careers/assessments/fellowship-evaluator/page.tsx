import { createMetadata } from '@/lib/metadata';
import { FellowshipEvaluatorClient } from './assessment-client';

export const metadata = createMetadata({
  title: 'Fellowship Program Quality Assessment',
  description: 'Evaluate your pharmaceutical fellowship program across 8 critical dimensions. Get a fellowship health score, benchmarking data, and improvement recommendations.',
  path: '/nucleus/careers/assessments/fellowship-evaluator',
});

export default function FellowshipEvaluatorPage() {
  return (
    <div className="min-h-screen bg-nex-surface">
      <FellowshipEvaluatorClient />
    </div>
  );
}
