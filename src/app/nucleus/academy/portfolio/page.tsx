import { PortfolioPageClient } from './portfolio-client';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Portfolio',
  description: 'View and manage your competency portfolio artifacts.',
  path: '/nucleus/academy/portfolio',
});

export default function PortfolioPage() {
  return (
    <div className="container mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-gold">My Portfolio</h1>
        <p className="text-slate-dim mb-6">
          Your competency artifacts and completed activities
        </p>

        <PortfolioPageClient />
      </div>
    </div>
  );
}
