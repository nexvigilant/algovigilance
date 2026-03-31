'use client';

import { useEffect } from 'react';
import { useBehaviorTracker, useCombinedEffects, useLearningVelocity } from '@/hooks/behavior-tracking';

interface AcademyTrackerProps {
  children: React.ReactNode;
}

export function AcademyTracker({ children }: AcademyTrackerProps) {
  const { startSession, endSession, trackContent: _trackContent } = useBehaviorTracker();
  const { combinedEffect, algorithms: _algorithms } = useCombinedEffects({ context: 'academy' });
  const { learningStyle, velocity } = useLearningVelocity({ tier: 'attentive' });

  // Track academy session
  useEffect(() => {
    startSession();
    return () => endSession();
  }, [startSession, endSession]);

  // Apply subtle dynamic styling based on learning patterns
  const dynamicStyles = {
    '--academy-primary': combinedEffect.primaryColor || 'rgba(0, 174, 239, 0.8)',
    '--academy-glow': combinedEffect.glowColor || 'rgba(212, 175, 55, 0.6)',
    '--academy-intensity': combinedEffect.intensity || 0.5,
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="relative">
      {children}

      {/* Subtle learning velocity indicator - visible to discerning users */}
      {learningStyle !== 'unknown' && (
        <div
          className="fixed bottom-4 right-4 w-2 h-2 rounded-full opacity-30 pointer-events-none"
          style={{
            background: combinedEffect.primaryColor,
            boxShadow: `0 0 ${4 + velocity * 2}px ${combinedEffect.glowColor}`,
            animation: `pulse ${3 - velocity}s ease-in-out infinite`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
