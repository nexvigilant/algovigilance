import { SurvivalPlotter } from './components/survival-plotter';

export const metadata = {
  title: 'Survival Curve Plotter | AlgoVigilance Vigilance',
  description: 'Kaplan-Meier survival analysis with Greenwood CI bands and recharts visualization',
};

export default function SurvivalPage() {
  return <SurvivalPlotter />;
}
