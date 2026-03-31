import { Briefcase } from 'lucide-react';
import { ComingSoon } from '@/components/marketing';
import { RELEASE_STATUS } from '@/data/launch-timeline';
import { createMetadata } from '@/lib/metadata';
import { MarketingSectionHeader } from '@/components/marketing/section-header';
import { BRANDED_STRINGS } from '@/lib/branded-strings';
import { CAREERS_HERO, CAREERS_COMING_SOON, CAREERS_FEATURES } from '@/data/careers-content';

/**
 * Metadata optimized for pharmacovigilance and life sciences job seekers.
 * Keywords target organic search for industry-specific career opportunities.
 */
export const metadata = createMetadata({
  title: 'Careers',
  description:
    'Vigilance and safety careers. We connect qualified practitioners with vetted enterprise and regulatory roles — based on what you can actually do.',
  path: '/careers',
  imageAlt: 'AlgoVigilance Careers - Vigilance and Safety Job Placement',
  keywords: [
    'vigilance careers',
    'safety analyst careers',
    'regulatory affairs careers',
    'compliance roles',
    'risk management recruitment',
    'industry positions',
    'vigilance professional roles',
  ],
});

export default function CareersPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6" data-testid="careers-page">
      {/*
       * Hero section with layered z-index strategy:
       * z-0: Background effects (radial-energy)
       * z-10: Content elements (text, icons)
       * Note: Site header uses z-50, so z-10 is safe here
       * Using div instead of header to avoid duplicate banner landmark
       */}
      <div className="relative text-center mb-12 py-12 pcb-grid overflow-hidden">
        <div className="radial-energy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <MarketingSectionHeader
          label={CAREERS_HERO.label}
          title={`AlgoVigilance ${BRANDED_STRINGS.careers.title}™`}
          className="relative z-10 mb-0"
        />
        <Briefcase className="relative z-10 h-12 w-12 mx-auto text-copper mt-4" aria-hidden="true" />
      </div>

      <ComingSoon
        title={CAREERS_COMING_SOON.title}
        description={CAREERS_COMING_SOON.description}
        launchTimeline={RELEASE_STATUS.MID_2026}
        features={CAREERS_FEATURES}
        waitlistTitle={CAREERS_COMING_SOON.waitlistTitle}
        waitlistBody={CAREERS_COMING_SOON.waitlistBody}
      />
    </div>
  );
}
