'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * Dynamic import wrapper for NeuralManifoldVisualization
 * Three.js requires client-side rendering only (no SSR)
 */
const NeuralManifoldVisualization = dynamic(
  () => import('./NeuralManifoldVisualization'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-nex-deep">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
          <p className="text-sm text-slate-dim">Loading Neural Manifold...</p>
        </div>
      </div>
    ),
  }
);

export default NeuralManifoldVisualization;
