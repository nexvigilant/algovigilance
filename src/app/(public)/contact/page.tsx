import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Sparkles, Shield, Loader2 } from 'lucide-react';
import { AnimatedStaggerContainer, AnimatedStaggerItem } from '@/components/ui/animated-stagger';
import { createMetadata } from '@/lib/metadata';
import { ContactForm } from './contact-form';
import {
  CONTACT_INFO_CARDS,
  WEBSITE_URLS,
  OPERATIONAL_HOURS,
  RESPONSE_COMMITMENTS,
  SERVICE_COMMITMENTS,
} from '@/data/business-operations';

/**
 * Loading fallback for form while search params resolve.
 */
function ContactFormSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-cyan" />
      <span className="sr-only">Loading form...</span>
    </div>
  );
}

export const metadata = createMetadata({
  title: 'Contact',
  description:
    'Get in touch with AlgoVigilance. Connect with our team about advisory services, safety oversight, or professional development.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-nex-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline text-white mb-6 uppercase tracking-wide" style={{ lineHeight: 1.15 }}>
              Let&apos;s <span className="text-cyan">Talk</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-nex-dark/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-headline text-white uppercase tracking-wide">
                Send Us a Message
              </h2>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 items-start">
              {/* Contact Form - Takes 3 columns */}
              <div className="lg:col-span-3">
                <Card className="border border-white/[0.12] bg-white/[0.06]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-gold" aria-hidden="true" />
                      <CardTitle className="text-gold">Secure Diagnostic Intake</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Suspense boundary for useSearchParams() in ContactForm */}
                    <Suspense fallback={<ContactFormSkeleton />}>
                      <ContactForm />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Info - Takes 2 columns */}
              <AnimatedStaggerContainer className="lg:col-span-2 space-y-6">
                <AnimatedStaggerItem>
                  <Card className="border border-white/[0.12] bg-white/[0.06]">
                    <CardHeader>
                      <CardTitle className="text-gold text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-dim">
                      {CONTACT_INFO_CARDS.map((contact) => (
                        <div key={contact.department}>
                          <strong className="text-slate-light">{contact.label}:</strong><br />
                          <a href={`mailto:${contact.email}`} className="text-cyan hover:underline">{contact.email}</a>
                        </div>
                      ))}
                      <div>
                        <strong className="text-slate-light">Website:</strong><br />
                        <a href={WEBSITE_URLS.main} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">{WEBSITE_URLS.displayName}</a>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedStaggerItem>

                <AnimatedStaggerItem>
                  <Card className="border border-white/[0.12] bg-white/[0.06]">
                    <CardHeader>
                      <CardTitle className="text-gold text-lg">Operational Hours</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-slate-dim">
                        {OPERATIONAL_HOURS.weekdays}
                      </p>
                      <p className="text-sm text-cyan">
                        {RESPONSE_COMMITMENTS.responseMessage}
                      </p>
                    </CardContent>
                  </Card>
                </AnimatedStaggerItem>

                <AnimatedStaggerItem>
                  <Card className="border border-cyan/20 bg-cyan/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-5 w-5 text-cyan" aria-hidden="true" />
                        <span className="text-sm font-semibold text-white">{SERVICE_COMMITMENTS.complimentaryDiagnosis.title}</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedStaggerItem>

                <AnimatedStaggerItem>
                  <Card className="border border-emerald-500/20 bg-emerald-500/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                        <span className="text-sm font-semibold text-white">{SERVICE_COMMITMENTS.riskSharing.title}</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedStaggerItem>
              </AnimatedStaggerContainer>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
