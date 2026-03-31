import { createMetadata } from '@/lib/metadata';
import { DrugNameResolver } from './components/drug-name-resolver';

export const metadata = createMetadata({
  title: 'Drug Name Resolver',
  description: 'Resolve trade names to INN (International Nonproprietary Names) — WHO Drug Dictionary analog for consistent drug identification',
  path: '/nucleus/vigilance/drug-resolver',
  keywords: ['WHO Drug Dictionary', 'INN', 'drug name', 'trade name', 'pharmacovigilance', 'normalization'],
});

export default function DrugResolverPage() {
  return <DrugNameResolver />;
}
