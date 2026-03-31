import { createMetadata } from '@/lib/metadata';
import SparseCodingCalculator from '@/components/sparse-coding/SparseCodingCalculatorWrapper';

export const metadata = createMetadata({
  title: 'Sparse Coding Efficiency Calculator',
  description: 'Thermodynamic analysis tool for neural coding efficiency. Compares sparse vs dense coding strategies using Landauer limit and Shannon entropy calculations.',
  path: '/design-system/sparse-coding',
  noIndex: true,
});

export default function SparseCodingPage() {
  return <SparseCodingCalculator />;
}
