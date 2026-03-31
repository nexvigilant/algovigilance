'use client'

import { useState, useEffect } from 'react'

export interface HardwareCapabilities {
  score: number
  tier: 'low' | 'medium' | 'high' | 'ultra'
  gpu: string
  isMobile: boolean
  isIntegrated: boolean
  cores: number
  memoryGB: number
  dpr: number
  hasWebgl2: boolean
  isSupported: boolean
}

export function useHardwareCapabilities(): HardwareCapabilities {
  const [caps, setCaps] = useState<HardwareCapabilities>({
    score: 50,
    tier: 'medium',
    gpu: 'unknown',
    isMobile: false,
    isIntegrated: true,
    cores: 4,
    memoryGB: 4,
    dpr: 1,
    hasWebgl2: false,
    isSupported: true,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const canvas = document.createElement('canvas')
      const gl2 = canvas.getContext('webgl2')
      const gl = gl2 ?? canvas.getContext('webgl')
      if (!gl) {
        setCaps(prev => ({ ...prev, isSupported: false, score: 0, tier: 'low' }))
        return
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase() : ''
      const isIntegrated = /intel|mesa|llvmpipe|swiftshader/.test(renderer)
      const isMobile = /adreno|mali|powervr|apple gpu/.test(renderer)
      const isDedicated = /nvidia|geforce|radeon|rtx|gtx/.test(renderer)
      const cores = navigator.hardwareConcurrency ?? 4
      const memoryGB = (navigator as { deviceMemory?: number }).deviceMemory ?? 4
      const dpr = window.devicePixelRatio ?? 1
      let score = 20
      if (isDedicated) score += 40
      else if (!isIntegrated && !isMobile) score += 20
      score += Math.min(20, cores * 2.5)
      score += Math.min(20, (memoryGB / 8) * 10)
      if (dpr > 2 && !isDedicated) score -= 15
      const normalizedScore = Math.max(0, Math.min(100, score))
      let tier: HardwareCapabilities['tier'] = 'low'
      if (normalizedScore > 80) tier = 'ultra'
      else if (normalizedScore > 50) tier = 'high'
      else if (normalizedScore > 30) tier = 'medium'
      setCaps({
        score: normalizedScore,
        tier,
        gpu: renderer,
        isMobile,
        isIntegrated,
        cores,
        memoryGB,
        dpr,
        hasWebgl2: !!gl2,
        isSupported: true,
      })
      // Invalidate WebGL backing store — releases GPU memory immediately
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    } catch (e) { console.warn('[CARE] Hardware detection failed', e) }
  }, [])
  return caps
}
