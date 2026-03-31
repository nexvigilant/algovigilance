import { createMetadata } from '@/lib/metadata';
import { GuidelinesSearch } from './components/guidelines-search';

export const metadata = createMetadata({
  title: 'Regulatory Guidelines',
  description: 'Search ICH, CIOMS, EMA, and FDA pharmacovigilance guidelines — 894+ indexed terms with full-text search',
  path: '/nucleus/vigilance/guidelines',
  keywords: ['ICH', 'CIOMS', 'EMA', 'FDA', 'guidelines', 'pharmacovigilance', 'regulatory'],
});

export default function GuidelinesPage() {
  return <GuidelinesSearch />;
}
