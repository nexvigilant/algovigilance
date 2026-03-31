import { createMetadata } from '@/lib/metadata';
import { IcsrManager } from './components/icsr-manager';

export const metadata = createMetadata({
  title: 'ICSR Case Management',
  description: 'Individual Case Safety Report management — E2B(R3) structured cases with causality and submission tracking',
  path: '/nucleus/vigilance/icsr',
  keywords: ['ICSR', 'case management', 'E2B', 'pharmacovigilance', 'adverse event reporting'],
});

export default function IcsrPage() {
  return <IcsrManager />;
}
