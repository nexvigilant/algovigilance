'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useObservatoryPreferences } from './use-observatory-preferences'
import { getQualityConfig, type QualityConfig } from './quality-presets'
import { getTheme, type ObservatoryTheme } from './themes'

/**
 * Bridges observatory preferences + quality presets into per-effect boolean state.
 *
 * - Reads preferences.quality -> getQualityConfig() -> seeds bloom/ssao/vignette defaults
 * - Reads preferences.theme -> getTheme() -> resolves full ObservatoryTheme object
 * - User toggles override preset via ref-tracked flag
 * - Quality level change resets non-overridden effects
 */

export interface UseExplorerEffectsReturn {
  // Post-processing toggles (with override tracking)
  enableBloom: boolean
  setEnableBloom: (v: boolean) => void
  enableSSAO: boolean
  setEnableSSAO: (v: boolean) => void
  enableVignette: boolean
  setEnableVignette: (v: boolean) => void
  enableDoF: boolean
  setEnableDoF: (v: boolean) => void
  enableChromaticAberration: boolean
  setEnableChromaticAberration: (v: boolean) => void
  // Passthrough from quality config (no override tracking needed)
  postProcessing: boolean
  theme: ObservatoryTheme
  qualityConfig: QualityConfig
}

export function useExplorerEffects(): UseExplorerEffectsReturn {
  const { preferences } = useObservatoryPreferences()

  const qualityConfig = useMemo(
    () => getQualityConfig(preferences.quality),
    [preferences.quality],
  )

  const theme = useMemo(
    () => getTheme(preferences.theme),
    [preferences.theme],
  )

  // Track which effects the user has explicitly toggled.
  // When quality level changes, non-overridden effects reset to preset defaults.
  const overriddenRef = useRef<Set<'bloom' | 'ssao' | 'vignette' | 'dof' | 'chromaticAberration'>>(new Set())
  const prevQualityRef = useRef(preferences.quality)

  const [enableBloom, setEnableBloomRaw] = useState(qualityConfig.bloom)
  const [enableSSAO, setEnableSSAORaw] = useState(qualityConfig.ssao)
  const [enableVignette, setEnableVignetteRaw] = useState(qualityConfig.vignette)
  const [enableDoF, setEnableDoFRaw] = useState(qualityConfig.dof)
  const [enableChromaticAberration, setEnableChromaticAberrationRaw] = useState(qualityConfig.chromaticAberration)

  // Detect quality level change and reset non-overridden effects
  useEffect(() => {
    if (prevQualityRef.current !== preferences.quality) {
      prevQualityRef.current = preferences.quality
      const nextConfig = getQualityConfig(preferences.quality)
      if (!overriddenRef.current.has('bloom')) setEnableBloomRaw(nextConfig.bloom)
      if (!overriddenRef.current.has('ssao')) setEnableSSAORaw(nextConfig.ssao)
      if (!overriddenRef.current.has('vignette')) setEnableVignetteRaw(nextConfig.vignette)
      if (!overriddenRef.current.has('dof')) setEnableDoFRaw(nextConfig.dof)
      if (!overriddenRef.current.has('chromaticAberration')) setEnableChromaticAberrationRaw(nextConfig.chromaticAberration)
    }
  }, [preferences.quality])

  const setEnableBloom = useCallback((v: boolean) => {
    overriddenRef.current.add('bloom')
    setEnableBloomRaw(v)
  }, [])

  const setEnableSSAO = useCallback((v: boolean) => {
    overriddenRef.current.add('ssao')
    setEnableSSAORaw(v)
  }, [])

  const setEnableVignette = useCallback((v: boolean) => {
    overriddenRef.current.add('vignette')
    setEnableVignetteRaw(v)
  }, [])

  const setEnableDoF = useCallback((v: boolean) => {
    overriddenRef.current.add('dof')
    setEnableDoFRaw(v)
  }, [])

  const setEnableChromaticAberration = useCallback((v: boolean) => {
    overriddenRef.current.add('chromaticAberration')
    setEnableChromaticAberrationRaw(v)
  }, [])

  const postProcessing = enableBloom || enableSSAO || enableVignette || enableDoF || enableChromaticAberration

  return {
    enableBloom,
    setEnableBloom,
    enableSSAO,
    setEnableSSAO,
    enableVignette,
    setEnableVignette,
    enableDoF,
    setEnableDoF,
    enableChromaticAberration,
    setEnableChromaticAberration,
    postProcessing,
    theme,
    qualityConfig,
  }
}
