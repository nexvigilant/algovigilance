'use client';

import Link from 'next/link';
import { useAnalytics } from '@/hooks/use-analytics';

export function SignUpCTA() {
  const { track } = useAnalytics();
  return (
    <Link
      href="/auth/signup"
      onClick={() => track('signup_clicked', { location: 'homepage_hero' })}
      className="rounded-xl bg-emerald-500 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30"
    >
      Sign Up Now — It&apos;s Free
    </Link>
  );
}
