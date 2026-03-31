'use client';

import Link from 'next/link';
import { useAnalytics } from '@/hooks/use-analytics';

export function ConnectAICTA() {
  const { track } = useAnalytics();
  return (
    <Link
      href="/station/connect"
      onClick={() => track('connect_ai_clicked', { location: 'homepage_hero' })}
      className="rounded-xl border-2 border-cyan-500/60 bg-cyan-500/10 px-8 py-3.5 text-lg font-bold text-cyan-300 shadow-lg shadow-cyan-500/10 transition-all hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-white"
    >
      Connect Your AI →
    </Link>
  );
}
