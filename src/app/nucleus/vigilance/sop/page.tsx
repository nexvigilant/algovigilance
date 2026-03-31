import { SopWorkflow } from './components/sop-workflow';

export const metadata = {
  title: 'ICH Signal Management SOP | AlgoVigilance Vigilance',
  description: 'Guided ICH-compliant signal management workflow — GVP Module IX + E2C(R2) + E2A procedures',
};

export default function SopPage() {
  return <SopWorkflow />;
}
