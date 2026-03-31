import { StatisticalWorkbench } from './components/statistical-workbench';

export const metadata = {
  title: 'Statistical Workbench | AlgoVigilance Vigilance',
  description: 'Welch t-test, OLS regression, Poisson CI, Bayesian posterior, and Shannon entropy via NexCore',
};

export default function StatisticsPage() {
  return <StatisticalWorkbench />;
}
