import { ChemistryPV } from './components/chemistry-pv';

export const metadata = {
  title: 'Chemistry-PV Transfer | AlgoVigilance Science',
  description:
    'Arrhenius, Michaelis-Menten, Gibbs, and 5 more chemistry equations mapped to pharmacovigilance concepts with T1 transfer confidence.',
};

export default function ChemistryPage() {
  return <ChemistryPV />;
}
