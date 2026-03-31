import { DrugComparator } from './components/drug-comparator';

export const metadata = {
  title: 'Drug Safety Comparator | AlgoVigilance Vigilance',
  description: 'Head-to-head drug safety comparison — parallel FAERS profiles, shared adverse event overlap, and differential signal analysis',
};

export default function ComparatorPage() {
  return <DrugComparator />;
}
