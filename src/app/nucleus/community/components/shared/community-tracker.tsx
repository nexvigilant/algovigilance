'use client';

import { useEffect } from 'react';
import { useBehaviorTracker } from '@/hooks/behavior-tracking';

interface CommunityTrackerProps {
  children: React.ReactNode;
}

export function CommunityTracker({ children }: CommunityTrackerProps) {
  const { startSession, endSession } = useBehaviorTracker();

  // Simplified: removed heavy algorithm hooks (useCombinedEffects, useEngagementRhythm, useCollaborationFrequency)
  // Static values for now - can be re-enabled when behavior tracking is active
  const combinedEffect = {
    primaryColor: 'rgba(0, 174, 239, 0.8)',
    glowColor: 'rgba(212, 175, 55, 0.6)',
    intensity: 0.5,
  };
  const collaborationStyle = 'balanced';

  // Track community session
  useEffect(() => {
    startSession();
    return () => endSession();
  }, [startSession, endSession]);

  // Apply subtle dynamic styling based on engagement patterns
  const dynamicStyles = {
    '--community-primary': combinedEffect.primaryColor || 'rgba(0, 174, 239, 0.8)',
    '--community-glow': combinedEffect.glowColor || 'rgba(212, 175, 55, 0.6)',
    '--community-intensity': combinedEffect.intensity || 0.5,
  } as React.CSSProperties;

  return (
    <div style={dynamicStyles} className="relative">
      {children}

      {/* Subtle collaboration indicator - visible to discerning users */}
      {collaborationStyle !== 'balanced' && (
        <div
          className="fixed bottom-4 right-4 flex items-center gap-1 opacity-20 pointer-events-none"
          aria-hidden="true"
        >
          {/* Multiple dots for collaborators, single for soloists */}
          {collaborationStyle === 'collaborator' ? (
            <>
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: combinedEffect.primaryColor,
                  boxShadow: `0 0 6px ${combinedEffect.glowColor}`,
                }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: combinedEffect.primaryColor,
                  boxShadow: `0 0 6px ${combinedEffect.glowColor}`,
                  animationDelay: '0.2s',
                }}
              />
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: combinedEffect.primaryColor,
                  boxShadow: `0 0 6px ${combinedEffect.glowColor}`,
                  animationDelay: '0.4s',
                }}
              />
            </>
          ) : (
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: combinedEffect.primaryColor,
                boxShadow: `0 0 8px ${combinedEffect.glowColor}`,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
