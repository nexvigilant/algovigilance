import { createMetadata } from '@/lib/metadata';
import { WatchtowerDashboard } from './components/watchtower-dashboard';

export const metadata = createMetadata({
  title: 'Watchtower',
  description: 'Real-time telemetry and internal state monitoring for the NexCore kernel',
  path: '/nucleus/admin/watchtower',
});

export default function WatchtowerPage() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-light">
          Watchtower (Kernel HUD)
        </h1>
        <p className="text-slate-dim text-sm mt-1">
          Monitor NexCore internal state, energy budgets, and system telemetry
        </p>
      </header>

      <WatchtowerDashboard />
    </div>
  );
}
