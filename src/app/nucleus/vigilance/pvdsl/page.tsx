import { PvdslEditor } from './components/pvdsl-editor';

export const metadata = {
  title: 'PVDSL Studio | AlgoVigilance Vigilance',
  description: 'Domain-specific language editor for programmable pharmacovigilance',
};

export default function PvdslPage() {
  return <PvdslEditor />;
}
