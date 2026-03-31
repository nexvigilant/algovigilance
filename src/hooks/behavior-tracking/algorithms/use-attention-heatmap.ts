'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBehaviorTracker } from '../use-behavior-tracker';
import type { EffectOutput, DiscoverabilityTier } from '../types';

interface AttentionConfig {
  enabled?: boolean;
  tier?: DiscoverabilityTier;
  intensity?: number;
  sampleRate?: number; // ms between mouse samples
  revealKey?: string; // Key to hold to reveal heatmap
}

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
  timestamp: number;
}

export function useAttentionHeatmap(config: AttentionConfig = {}) {
  const {
    enabled = true,
    tier = 'hidden',
    intensity = 1,
    sampleRate = 500,
    revealKey = 'Alt',
  } = config;

  const { trackMouseSample } = useBehaviorTracker();
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [readingPattern, setReadingPattern] = useState<'focused' | 'scanner' | 'rereader' | 'unknown'>('unknown');
  const lastSampleRef = useRef<number>(0);
  const pageIdRef = useRef<string>('');

  // Track mouse movements (sampled)
  const trackMouse = useCallback((e: MouseEvent) => {
    if (!enabled) return;

    const now = Date.now();
    if (now - lastSampleRef.current < sampleRate) return;
    lastSampleRef.current = now;

    const point: HeatPoint = {
      x: (e.clientX / window.innerWidth) * 100,
      y: (e.clientY / window.innerHeight) * 100,
      intensity: 1,
      timestamp: now,
    };

    setHeatPoints((prev) => {
      const updated = [...prev, point].slice(-500); // Keep last 500 points
      return updated;
    });

    trackMouseSample(point.x, point.y, pageIdRef.current);
  }, [enabled, sampleRate, trackMouseSample]);

  // Analyze reading pattern from heat points
  useEffect(() => {
    if (heatPoints.length < 50) return;

    const recentPoints = heatPoints.slice(-100);

    // Calculate movement patterns
    let totalDistance = 0;
    let xChanges = 0;
    let yReturns = 0;
    let lastY = recentPoints[0].y;

    for (let i = 1; i < recentPoints.length; i++) {
      const dx = recentPoints[i].x - recentPoints[i - 1].x;
      const dy = recentPoints[i].y - recentPoints[i - 1].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);

      if (Math.abs(dx) > 5) xChanges++;
      if (recentPoints[i].y < lastY - 10) yReturns++;
      lastY = Math.max(lastY, recentPoints[i].y);
    }

    const avgMovement = totalDistance / recentPoints.length;

    if (yReturns > recentPoints.length * 0.2) {
      setReadingPattern('rereader');
    } else if (xChanges > recentPoints.length * 0.5 && avgMovement > 5) {
      setReadingPattern('scanner');
    } else if (avgMovement < 3) {
      setReadingPattern('focused');
    }
  }, [heatPoints]);

  // Key listener for reveal
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === revealKey) {
        setIsRevealed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === revealKey) {
        setIsRevealed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', trackMouse);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', trackMouse);
    };
  }, [enabled, revealKey, trackMouse]);

  // Set page ID
  const setPageId = useCallback((id: string) => {
    pageIdRef.current = id;
    setHeatPoints([]); // Clear on page change
  }, []);

  // Generate heatmap gradient data
  const heatmapData = useMemo(() => {
    if (!isRevealed || heatPoints.length === 0) return null;

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    return heatPoints.map((point) => ({
      ...point,
      intensity: point.intensity * intensity * tierMultiplier,
    }));
  }, [isRevealed, heatPoints, tier, intensity]);

  // Effect based on reading pattern
  const effect = useMemo((): EffectOutput => {
    if (!enabled) return {};

    const tierMultiplier = {
      obvious: 1,
      attentive: 0.7,
      discerning: 0.4,
      hidden: 0.1,
    }[tier];

    const effectIntensity = intensity * tierMultiplier;

    switch (readingPattern) {
      case 'focused':
        // Clear, linear heat trails
        return {
          primaryColor: `rgba(0, 174, 239, ${effectIntensity})`,
          glowColor: `rgba(0, 174, 239, ${effectIntensity * 0.6})`,
          particleCount: Math.round(4 * effectIntensity),
          particleSpeed: 0.5,
          particleDirection: 'linear',
          trailEffect: true,
          intensity: effectIntensity,
        };

      case 'scanner':
        // Scattered, jumping patterns
        return {
          primaryColor: `rgba(212, 175, 55, ${effectIntensity})`,
          secondaryColor: `rgba(0, 174, 239, ${effectIntensity * 0.5})`,
          glowColor: `rgba(212, 175, 55, ${effectIntensity * 0.5})`,
          particleCount: Math.round(8 * effectIntensity),
          particleSpeed: 2,
          particleDirection: 'chaotic',
          intensity: effectIntensity,
        };

      case 'rereader':
        // Loops and returns
        return {
          primaryColor: `rgba(184, 115, 51, ${effectIntensity})`,
          secondaryColor: `rgba(212, 175, 55, ${effectIntensity * 0.4})`,
          glowColor: `rgba(184, 115, 51, ${effectIntensity * 0.6})`,
          particleCount: Math.round(6 * effectIntensity),
          particleSpeed: 1,
          particleDirection: 'orbital',
          waveEffect: true,
          intensity: effectIntensity,
        };

      default:
        return {
          primaryColor: `rgba(148, 163, 184, ${effectIntensity * 0.4})`,
          intensity: effectIntensity * 0.3,
        };
    }
  }, [enabled, tier, intensity, readingPattern]);

  return {
    effect,
    heatmapData,
    isRevealed,
    readingPattern,
    setPageId,
    pointCount: heatPoints.length,
  };
}
