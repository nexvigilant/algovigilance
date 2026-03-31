import { createMetadata } from '@/lib/metadata';
import { SemaglutidePancreatitisReport } from './components/signal-report';

export const metadata = createMetadata({
  title: 'Semaglutide + Pancreatitis — Signal Investigation',
  description:
    'Complete pharmacovigilance signal investigation for semaglutide and pancreatitis using the AlgoVigilance Station 8-step pipeline. PRR 6.93, PROBABLE causality, 52μs microgram verdict.',
  path: '/nucleus/vigilance/worked-examples/semaglutide-pancreatitis',
  keywords: [
    'semaglutide',
    'pancreatitis',
    'signal detection',
    'pharmacovigilance',
    'PRR',
    'ROR',
    'disproportionality',
    'FAERS',
  ],
});

export default function SemaglutidePancreatitisPage() {
  return <SemaglutidePancreatitisReport />;
}
