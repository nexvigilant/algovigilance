import { ShieldCheck } from 'lucide-react';
import { ComingSoon } from '@/components/marketing';
import { createMetadata } from '@/lib/metadata';
import { BRANDED_STRINGS } from '@/lib/branded-strings';
import { MarketingSectionHeader } from '@/components/marketing/section-header';
import { GUARDIAN_HERO, GUARDIAN_FEATURES } from '@/data/guardian-content';

export const metadata = createMetadata({
  title: 'Guardian',
  description:
    'Independent safety monitoring. Continuous, data-driven oversight that no commercial interest can influence.',
  path: '/guardian',
});

export default function GuardianPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6" data-testid="guardian-page">
      <header className="relative text-center mb-12 py-12 pcb-grid overflow-hidden">
        <div className="radial-energy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <MarketingSectionHeader
          label={GUARDIAN_HERO.label}
          title={`AlgoVigilance ${BRANDED_STRINGS.guardian.title}™`}
          className="relative z-10 mb-0"
        />
        <ShieldCheck className="relative z-10 h-12 w-12 mx-auto text-cyan mt-4" />
      </header>

      <ComingSoon
        title={`${BRANDED_STRINGS.guardian.title}™ Launching ${BRANDED_STRINGS.guardian.launchTimeline}`}
        description={BRANDED_STRINGS.guardian.launchDescription}
        launchTimeline={BRANDED_STRINGS.guardian.launchTimeline}
        features={GUARDIAN_FEATURES}
      />
    </div>
  );
}
