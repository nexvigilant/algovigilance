import { PortfolioMonitor } from './components/portfolio-monitor';

export const metadata = {
  title: 'Drug Portfolio Monitor | AlgoVigilance Vigilance',
  description: 'Continuous safety intelligence across your drug portfolio — FAERS signals, regulatory status, and competitive positioning in one view',
};

export default function PortfolioPage() {
  return <PortfolioMonitor />;
}
