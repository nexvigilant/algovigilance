'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CURRENT_PHASE } from '@/data/launch-timeline';
import {
  COMMUNITY_HERO,
  DISCOVERY_QUIZ_CTA,
  COMMUNITY_VALUE_PROPS,
} from '@/data/community-content';

export function CommunityPageContent() {
  const { user, loading } = useAuth();
  const { track } = useAnalytics();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // If user is authenticated, redirect to community forums immediately
    // Use ref to prevent double redirect
    if (!loading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/nucleus/community/circles');
    }
  }, [user, loading, router]);

  // Show the marketing page immediately - authenticated users are redirected before interaction
  // All CTAs link to public routes, so no need to conditionally hide them

  return (
    <div className="container mx-auto px-4 py-12 md:px-6" data-testid="community-page">
      {/* Hero — title only, let the platform speak */}
      <div className="relative text-center mb-16 py-12 md:py-16">
        <div className="radial-energy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <h1 className="relative z-10 font-headline text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">
          {COMMUNITY_HERO.title}
        </h1>
        <p className="relative z-10 mt-4 text-md text-gold font-semibold">
          {COMMUNITY_HERO.tagline}
        </p>
      </div>

      {/* Single action: Discovery Quiz */}
      <div className="mb-20 max-w-xl mx-auto text-center">
        <Sparkles className="mx-auto h-10 w-10 text-cyan-glow mb-4" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-white mb-6">
          {DISCOVERY_QUIZ_CTA.title}
        </h2>
        <Button
          asChild
          size="lg"
          className="bg-cyan hover:bg-cyan/90 text-nex-deep font-semibold touch-target"
          onClick={() => track("button_click", { location: "community_quiz", action: DISCOVERY_QUIZ_CTA.ctaText })}
        >
          <Link href={DISCOVERY_QUIZ_CTA.ctaHref}>
            {DISCOVERY_QUIZ_CTA.ctaText}
            <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {/* Value props — compact, no paragraphs */}
      <div className="max-w-2xl mx-auto mb-20">
        <ul className="space-y-3">
          {COMMUNITY_VALUE_PROPS.map((prop) => (
            <li key={prop.title} className="flex items-center gap-3 text-slate-dim">
              <CheckCircle className="h-5 w-5 text-cyan flex-shrink-0" aria-hidden="true" />
              <span className="text-slate-light">{prop.title}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Single CTA */}
      <div className="text-center">
        <Button
          asChild
          size="lg"
          className="bg-cyan hover:bg-cyan/90 text-nex-deep font-semibold touch-target"
          onClick={() => track("signup_started", { location: "community_bottom" })}
        >
          <Link href="/auth/signup">{CURRENT_PHASE.ctaText}</Link>
        </Button>
      </div>
    </div>
  );
}
