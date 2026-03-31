import { createMetadata } from '@/lib/metadata';
import { TerminologyBrowser } from './components/terminology-browser';

export const metadata = createMetadata({
  title: 'Terminology Browser',
  description: 'Browse and search MedDRA hierarchy — SOC, HLGT, HLT, PT, LLT with cross-terminology mappings to MeSH, SNOMED, ICH',
  path: '/nucleus/vigilance/terminology',
  keywords: ['MedDRA', 'terminology', 'SOC', 'preferred term', 'pharmacovigilance', 'coding'],
});

export default function TerminologyPage() {
  return <TerminologyBrowser />;
}
