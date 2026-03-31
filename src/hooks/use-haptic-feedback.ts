'use client';

import { useCallback } from 'react';

interface HapticOptions {
  enabled?: boolean;
}

export function useHapticFeedback(options: HapticOptions = {}) {
  const { enabled = true } = options;

  // Check if vibration is supported
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // Light tap - for hover/focus
  const lightTap = useCallback(() => {
    if (!enabled || !isSupported) return;
    navigator.vibrate(10);
  }, [enabled, isSupported]);

  // Medium tap - for selection/click
  const mediumTap = useCallback(() => {
    if (!enabled || !isSupported) return;
    navigator.vibrate(25);
  }, [enabled, isSupported]);

  // Heavy tap - for important actions
  const heavyTap = useCallback(() => {
    if (!enabled || !isSupported) return;
    navigator.vibrate(50);
  }, [enabled, isSupported]);

  // Success pattern - two short pulses
  const success = useCallback(() => {
    if (!enabled || !isSupported) return;
    navigator.vibrate([20, 50, 20]);
  }, [enabled, isSupported]);

  // Error pattern - three short pulses
  const error = useCallback(() => {
    if (!enabled || !isSupported) return;
    navigator.vibrate([30, 30, 30, 30, 30]);
  }, [enabled, isSupported]);

  // Warning pattern - long pulse
  const warning = useCallback(() => {
    if (!enabled || !isSupported) return;
    navigator.vibrate(100);
  }, [enabled, isSupported]);

  // Custom pattern
  const pattern = useCallback((vibrationPattern: number | number[]) => {
    if (!enabled || !isSupported) return;
    navigator.vibrate(vibrationPattern);
  }, [enabled, isSupported]);

  return {
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
    warning,
    pattern,
    isSupported,
  };
}
