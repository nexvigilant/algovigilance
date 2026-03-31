import { createMetadata } from '@/lib/metadata';
import { ExpectednessClassifier } from './components/expectedness-classifier';

export const metadata = createMetadata({
  title: 'Expectedness Classifier',
  description: 'Determine if an adverse event is listed or unlisted relative to product labeling — ICH E2A expectedness assessment',
  path: '/nucleus/vigilance/expectedness',
  keywords: ['expectedness', 'listed', 'unlisted', 'unexpected', 'ICH E2A', 'pharmacovigilance', 'labeling'],
});

export default function ExpectednessPage() {
  return <ExpectednessClassifier />;
}
