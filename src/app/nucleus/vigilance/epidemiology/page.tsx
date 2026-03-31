import { EpidemiologyCalculator } from './components/epidemiology-calculator';

export const metadata = {
  title: 'Epidemiology Calculator | AlgoVigilance Vigilance',
  description: 'Client-side epidemiology measures — RR, OR, AR, NNT/NNH, AF, PAF, incidence, prevalence, Kaplan-Meier, SMR',
};

export default function EpidemiologyPage() {
  return <EpidemiologyCalculator />;
}
