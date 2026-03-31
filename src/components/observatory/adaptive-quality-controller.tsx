'use client'

import React, { useMemo } from 'react'
import { useAdaptiveQuality } from '@/lib/observatory/use-adaptive-quality'
// usePerformance does not exist in @react-three/drei — removed
// TODO: Replace with usePerformanceMonitor when CARE controller is fully wired

interface Props {
  children: React.ReactNode
  onAdapt?: (factor: number) => void
}

/**
 * CARE Controller — Injects performance-aware scaling into the R3F graph.
 */
export function AdaptiveQualityController({ children, onAdapt }: Props) {
  const { currentFps, factor, isThrottled } = useAdaptiveQuality()
  
  React.useEffect(() => {
    if (onAdapt) onAdapt(factor)
  }, [factor, onAdapt])

  return (
    <>
      {children}
      {/* HUD element for dev/debug if needed */}
      {process.env.NODE_ENV === 'development' && isThrottled && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(220, 38, 38, 0.8)',
          color: 'white',
          padding: '4px 8px',
          fontSize: '10px',
          fontFamily: 'monospace',
          borderRadius: '4px',
          zIndex: 100
        }}>
          CARE THROTTLING: {Math.round(factor * 100)}% (FPS: {currentFps})
        </div>
      )}
    </>
  )
}
