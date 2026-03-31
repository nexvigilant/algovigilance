'use client';

import type { VigilActivityType } from '@/lib/vigil-coins';

export function emitVigilActivity(type: VigilActivityType, source?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('vigil:activity', {
      detail: { type, source },
    })
  );
}
