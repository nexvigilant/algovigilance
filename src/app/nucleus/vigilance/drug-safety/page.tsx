import { FaersDrugSearch } from './components/faers-drug-search';

export const metadata = {
  title: 'Drug Safety | AlgoVigilance Vigilance',
  description: 'FAERS adverse event search — drug-event profiles powered by FDA data',
};

export default function DrugSafetyPage() {
  return <FaersDrugSearch />;
}
