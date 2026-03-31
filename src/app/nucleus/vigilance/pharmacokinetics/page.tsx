import { PkCalculator } from './components/pk-calculator';

export const metadata = {
  title: 'Pharmacokinetics Calculator | AlgoVigilance Vigilance',
  description: 'AUC, clearance, steady-state, volume of distribution, and Michaelis-Menten kinetics via NexCore',
};

export default function PharmacokieneticsPage() {
  return <PkCalculator />;
}
