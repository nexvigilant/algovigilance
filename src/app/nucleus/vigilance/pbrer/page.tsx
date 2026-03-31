import { PbrerGenerator } from './components/pbrer-generator';

export const metadata = {
  title: 'PBRER Generator | AlgoVigilance Vigilance',
  description: 'Periodic Benefit-Risk Evaluation Report — ICH E2C(R2) compliant section generator with live FAERS signal data and client-side analysis',
};

export default function PbrerPage() {
  return <PbrerGenerator />;
}
