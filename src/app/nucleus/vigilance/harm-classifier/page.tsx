import { HarmClassifierTool } from './components/harm-classifier-tool';

export const metadata = {
  title: 'Harm Classifier | AlgoVigilance Vigilance',
  description: 'Theory of Vigilance 8-type harm taxonomy (A-H) with safety margin calculator',
};

export default function HarmClassifierPage() {
  return <HarmClassifierTool />;
}
