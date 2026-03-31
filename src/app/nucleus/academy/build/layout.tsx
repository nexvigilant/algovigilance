'use client';

import { useEffect } from 'react';

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lock scrolling on mount for immersive learning
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Immersive learning experience - no nav, full screen, absolute positioning
  return (
    <div className="fixed inset-0 z-40 bg-background">
      {children}
    </div>
  );
}
