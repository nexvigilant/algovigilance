'use client';

import { useEffect } from 'react';

/**
 * Adds 'js-ready' class to document root when JavaScript is loaded.
 * Enables progressive enhancement for CSS animations like scroll-reveal.
 *
 * @see src/styles/effects/circuit.css - .js-ready .scroll-reveal
 */
export function JsReadyMarker() {
  useEffect(() => {
    document.documentElement.classList.add('js-ready');
  }, []);

  return null;
}
