import { SiteHeader } from '@/components/layout/headers';
import { EmeraldCityBackground, EmeraldCityPresets } from '@/components/effects/emerald-city-background';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Account Access',
  description: 'Sign in, create an account, or reset your password to access AlgoVigilance Nucleus — your pharmacovigilance intelligence portal.',
  path: '/auth',
  noIndex: true,
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden">
      {/* Emerald City Background - Auth preset (clean, premium) */}
      <EmeraldCityBackground {...EmeraldCityPresets.auth} />

      <SiteHeader />
      <main id="main-content" className="relative z-10 flex-1">
        {children}
      </main>
    </div>
  );
}
