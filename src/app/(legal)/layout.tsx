import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/headers';
import { SiteFooter } from '@/components/layout/footers';
import { LegalNav } from '@/components/layout/navigation';
import { EmeraldCityBackground, EmeraldCityPresets } from '@/components/effects/emerald-city-background';

export const metadata: Metadata = {
  openGraph: {
    type: 'website',
    siteName: 'AlgoVigilance Nucleus',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden">
      {/* Emerald City Background - Legal preset (minimal, professional) */}
      <EmeraldCityBackground {...EmeraldCityPresets.legal} />

      <SiteHeader />
      <div className="relative z-10 flex-1 container mx-auto px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <LegalNav />
          </div>

          {/* Main Content with Prose Styling */}
          <main id="main-content" className="lg:col-span-9 prose prose-lg dark:prose-invert max-w-none">
            {children}
          </main>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
