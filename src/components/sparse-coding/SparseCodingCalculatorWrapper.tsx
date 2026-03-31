'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export interface SparseCodingCalculatorProps {
  highlightSection?: string;
  onSectionClick?: (sectionId: string) => void;
}

/**
 * Dynamic import wrapper for SparseCodingCalculator
 * Recharts benefits from client-side rendering only
 */
const SparseCodingCalculator = dynamic<SparseCodingCalculatorProps>(
  () => import('./SparseCodingCalculator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-nex-deep">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
          <p className="text-sm text-slate-dim">Loading Sparse Coding Calculator...</p>
        </div>
      </div>
    ),
  }
);

export default SparseCodingCalculator;
