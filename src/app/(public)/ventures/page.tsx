import { Zap } from 'lucide-react';
import { ComingSoon } from '@/components/marketing';
import { createMetadata } from '@/lib/metadata';
import { BRANDED_STRINGS } from '@/lib/branded-strings';
import { VENTURES_HERO, VENTURES_FEATURES } from '@/data/ventures-content';

export const metadata = createMetadata({
  title: 'Ventures',
  description:
    'Capital, clinical expertise, and guidance for founders building better patient safety technology.',
  path: '/ventures',
});

export default function VenturesPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <header className="relative text-center mb-12 py-12 pcb-grid overflow-hidden">
        <div className="radial-energy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <p className="relative z-10 text-lg font-mono uppercase tracking-widest text-gold/80 mb-4">
          {VENTURES_HERO.label}
        </p>
        <Zap className="relative z-10 h-12 w-12 mx-auto text-cyan" />
        <h1 className="relative z-10 text-4xl md:text-5xl font-bold font-headline tracking-wide text-gold mt-4 uppercase">
          AlgoVigilance {BRANDED_STRINGS.ventures.title}™
        </h1>
      </header>

      <ComingSoon
        title={BRANDED_STRINGS.ventures.launchTitle}
        description={BRANDED_STRINGS.ventures.launchDescription}
        launchTimeline={BRANDED_STRINGS.ventures.launchTimeline}
        features={VENTURES_FEATURES}
      />
    </div>
  );
}
