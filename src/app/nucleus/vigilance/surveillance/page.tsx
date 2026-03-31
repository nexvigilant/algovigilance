import { SurveillanceDashboard } from './components/surveillance-dashboard';

export const metadata = {
  title: 'Sequential Surveillance | AlgoVigilance Vigilance',
  description: 'SPRT, CUSUM, and Weibull time-to-onset analysis for sequential signal monitoring',
};

export default function SurveillancePage() {
  return <SurveillanceDashboard />;
}
