'use client'

import { useState, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useHardwareCapabilities } from './use-hardware-capabilities'

export interface AdaptiveState {
  currentFps: number
  targetFps: number
  factor: number // 0.0 (low) to 1.0 (ultra)
  isThrottled: boolean
}

export function useAdaptiveQuality(targetFps = 60): AdaptiveState {
  const { score } = useHardwareCapabilities()
  const [fps, setFps] = useState(targetFps)
  const [factor, setFactor] = useState(score / 100)
  const frameTimes = useRef<number[]>([])
  const lastTime = useRef(performance.now())

  useFrame(() => {
    const now = performance.now()
    const delta = now - lastTime.current
    lastTime.current = now

    frameTimes.current.push(delta)
    if (frameTimes.current.length > 60) {
      frameTimes.current.shift()
      const avgDelta = frameTimes.current.reduce((a, b) => a + b, 0) / 60
      const currentFps = 1000 / avgDelta
      setFps(Math.round(currentFps))

      // Adaptive logic: if FPS < 80% of target, decrease factor
      if (currentFps < targetFps * 0.8) {
        setFactor(prev => Math.max(0.1, prev - 0.05))
      } else if (currentFps > targetFps * 0.95 && factor < (score / 100)) {
        // Slowly recover if possible, but don't exceed hardware baseline
        setFactor(prev => Math.min(score / 100, prev + 0.01))
      }
    }
  })

  return {
    currentFps: fps,
    targetFps,
    factor,
    isThrottled: factor < (score / 100),
  }
}
