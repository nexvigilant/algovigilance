'use client';

import { ShieldCheck, Handshake, TrendingUp } from 'lucide-react';
import { MarketingFeatureCard } from '@/components/marketing/feature-card';

export function AboutFeatureCards() {
  return (
    <div className="space-y-golden-3">
      <MarketingFeatureCard
        icon={ShieldCheck}
        variant="cyan"
        title="Guardian: Independent Safety"
        description={
          <>
            We monitor drug safety.{' '}
            <span className="text-cyan-400">No one pays us to look the other way</span>.
          </>
        }
      />

      <MarketingFeatureCard
        icon={Handshake}
        variant="gold"
        title="Solutions: Expert Advisory"
        description={
          <>
            We advise safety teams.{' '}
            <span className="text-gold-400">We succeed when you succeed</span>.
          </>
        }
      />

      <MarketingFeatureCard
        icon={TrendingUp}
        variant="copper"
        title="Community: Professional Network"
        description={
          <>
            Training, tools, and{' '}
            <span className="text-copper">
              a network of professionals
            </span>. Everything you need to grow.
          </>
        }
      />
    </div>
  );
}
