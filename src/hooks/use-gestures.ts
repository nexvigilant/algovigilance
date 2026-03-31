'use client';

import { useCallback, useRef, useEffect } from 'react';
import { UI_THRESHOLDS } from '@/lib/constants/config';

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
}

interface GestureOptions {
  threshold?: number;
  enabled?: boolean;
}

export function useGestures(
  elementRef: React.RefObject<HTMLElement>,
  handlers: GestureHandlers,
  options: GestureOptions = {}
) {
  const { threshold = UI_THRESHOLDS.GESTURE_DEFAULT, enabled = true } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const initialPinchDistanceRef = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    } else if (e.touches.length === 2) {
      // Calculate initial pinch distance
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || e.touches.length !== 2) return;

    // Handle pinch
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    if (initialPinchDistanceRef.current > 0) {
      const delta = currentDistance - initialPinchDistanceRef.current;

      if (Math.abs(delta) > threshold) {
        if (delta > 0 && handlers.onPinchOut) {
          handlers.onPinchOut();
        } else if (delta < 0 && handlers.onPinchIn) {
          handlers.onPinchIn();
        }
        initialPinchDistanceRef.current = currentDistance;
      }
    }
  }, [enabled, handlers, threshold]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStartRef.current) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now(),
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;

    // Check for double tap
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      const now = Date.now();
      if (now - lastTapRef.current < 300 && handlers.onDoubleTap) {
        handlers.onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }

    // Check for swipe
    if (deltaTime < 500) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > threshold && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < -threshold && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < -threshold && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }

    touchStartRef.current = null;
  }, [enabled, handlers, threshold]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
