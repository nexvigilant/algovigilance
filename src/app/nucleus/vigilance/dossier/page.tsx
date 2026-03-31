import { DrugDossier } from './components/drug-dossier';

export const metadata = {
  title: 'Drug Intelligence Dossier | AlgoVigilance Vigilance',
  description: 'Comprehensive drug safety intelligence — FAERS signals, disproportionality analysis, causality pointers, regulatory cross-reference, and competitive landscape',
};

export default function DossierPage() {
  return <DrugDossier />;
}
