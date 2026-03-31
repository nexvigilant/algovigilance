import { PmrComplianceDashboard } from './components/pmr-compliance-dashboard';

export const metadata = {
  title: 'PMR/PMC Compliance | AlgoVigilance Vigilance',
  description: 'FDA Postmarketing Requirements and Commitments compliance monitoring — status tracking, delay analysis, FAERS cross-reference',
};

export default function PmrCompliancePage() {
  return <PmrComplianceDashboard />;
}
