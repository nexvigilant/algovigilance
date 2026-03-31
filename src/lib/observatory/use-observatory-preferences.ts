'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { QualityLevel } from './quality-presets'
import { detectQualityLevel } from './quality-presets'
import type { ObservatoryThemeId } from './themes'
import type { CVDMode } from './types'

// ─── Types ─────────────────────────────────────────────────────────────

export interface ObservatoryPreferences {
  quality: QualityLevel
  theme: ObservatoryThemeId
  cvdMode: CVDMode
  defaultExplorer: string
  defaultLayout: string
  enableWorkerLayout: boolean
  postProcessing: string[]
  atmosphere: 'deep-space' | 'clinical' | 'war-room' | 'blueprint' | 'auto'
}

const STORAGE_KEY = 'observatory-preferences'
const LEGACY_THEME_KEY = 'observatory-theme'

const DEFAULT_PREFERENCES: ObservatoryPreferences = {
  quality: 'medium',
  theme: 'default',
  cvdMode: 'normal',
  defaultExplorer: 'graph',
  defaultLayout: 'force',
  enableWorkerLayout: true,
  postProcessing: ['bloom'],
  atmosphere: 'deep-space',
}

// ─── Persistence ───────────────────────────────────────────────────────

function loadPreferences(): ObservatoryPreferences | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    // Migrate legacy theme key if present (useObservatoryTheme wrote to 'observatory-theme')
    const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY)
    if (legacyTheme && (legacyTheme === 'warm' || legacyTheme === 'clinical' || legacyTheme === 'high-contrast')) {
      localStorage.removeItem(LEGACY_THEME_KEY)
      const migrated = { ...DEFAULT_PREFERENCES, theme: legacyTheme as ObservatoryThemeId }
      savePreferences(migrated)
      return migrated
    }
    if (legacyTheme) {
      localStorage.removeItem(LEGACY_THEME_KEY) // clean up 'default' value
    }
    return null
  }
  try {
    return JSON.parse(raw) as ObservatoryPreferences
  } catch {
    return null
  }
}

function savePreferences(prefs: ObservatoryPreferences): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

// ─── Auto-Detection ────────────────────────────────────────────────────

function detectPreferences(): ObservatoryPreferences {
  const quality = detectQualityLevel()

  // Respect OS accessibility preferences
  let theme: ObservatoryThemeId = 'default'
  let postProcessing = quality === 'low' ? [] : ['bloom']
  if (typeof window !== 'undefined') {
    if (window.matchMedia?.('(prefers-contrast: more)')?.matches) {
      theme = 'high-contrast'
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      postProcessing = []
    }
  }

  return {
    ...DEFAULT_PREFERENCES,
    quality,
    theme,
    postProcessing,
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────

export interface UseObservatoryPreferencesReturn {
  preferences: ObservatoryPreferences
  updatePreference: <K extends keyof ObservatoryPreferences>(
    key: K,
    value: ObservatoryPreferences[K],
  ) => void
  resetToDetected: () => void
  isDetected: boolean
}

export function useObservatoryPreferences(): UseObservatoryPreferencesReturn {
  const detectedRef = useRef(false)
  const [preferences, setPreferences] = useState<ObservatoryPreferences>(() => {
    const stored = loadPreferences()
    if (stored) return stored
    return DEFAULT_PREFERENCES
  })
  const [isDetected, setIsDetected] = useState(false)

  // Auto-detect on first mount if no stored preferences
  useEffect(() => {
    if (detectedRef.current) return
    detectedRef.current = true
    const stored = loadPreferences()
    if (!stored) {
      const detected = detectPreferences()
      setPreferences(detected)
      savePreferences(detected)
      setIsDetected(true)
    }
  }, [])

  const updatePreference = useCallback(<K extends keyof ObservatoryPreferences>(
    key: K,
    value: ObservatoryPreferences[K],
  ) => {
    setPreferences(prev => {
      const next = { ...prev, [key]: value }
      savePreferences(next)
      return next
    })
    setIsDetected(false)
  }, [])

  const resetToDetected = useCallback(() => {
    const detected = detectPreferences()
    setPreferences(detected)
    savePreferences(detected)
    setIsDetected(true)
  }, [])

  return { preferences, updatePreference, resetToDetected, isDetected }
}
