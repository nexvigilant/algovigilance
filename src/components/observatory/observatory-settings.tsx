'use client'

import { Settings, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { QualityLevel } from '@/lib/observatory/quality-presets'
import { QUALITY_LABELS } from '@/lib/observatory/quality-presets'
import { THEME_OPTIONS, type ObservatoryThemeId } from '@/lib/observatory/themes'
import { CVD_OPTIONS } from './explorer-shared'
import type { ObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
import { EXPLORER_REGISTRY, type ObservatoryExplorerType } from '@/lib/observatory/explorer-registry'

// ─── Constants ─────────────────────────────────────────────────────────

const QUALITY_OPTIONS: { value: QualityLevel; label: string }[] = [
  { value: 'low', label: QUALITY_LABELS.low },
  { value: 'medium', label: QUALITY_LABELS.medium },
  { value: 'high', label: QUALITY_LABELS.high },
  { value: 'cinematic', label: QUALITY_LABELS.cinematic },
]

const LAYOUT_OPTIONS = [
  { value: 'force', label: 'Force' },
  { value: 'hierarchy', label: 'Hierarchy' },
  { value: 'radial', label: 'Radial' },
  { value: 'grid', label: 'Grid' },
]

const ATMOSPHERE_OPTIONS: { value: ObservatoryPreferences['atmosphere']; label: string }[] = [
  { value: 'deep-space', label: 'Deep Space' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'war-room', label: 'War Room' },
  { value: 'blueprint', label: 'Blueprint' },
]

// ─── Component ─────────────────────────────────────────────────────────

interface ObservatorySettingsProps {
  preferences: ObservatoryPreferences
  onUpdate: <K extends keyof ObservatoryPreferences>(key: K, value: ObservatoryPreferences[K]) => void
  onReset: () => void
  isDetected?: boolean
  compact?: boolean
  activeExplorer?: ObservatoryExplorerType
}

export function ObservatorySettings({
  preferences,
  onUpdate: updatePreference,
  onReset: resetToDetected,
  isDetected = false,
  compact = false,
  activeExplorer,
}: ObservatorySettingsProps) {
  const capabilities = activeExplorer ? EXPLORER_REGISTRY[activeExplorer] : null
  const showCvd = !capabilities || capabilities.cvd
  const showLayout = !capabilities || capabilities.component === 'ForceGraph3D'
  const [open, setOpen] = useState(false)

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="px-2.5 py-1 text-xs font-mono bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-cyan/30 hover:text-white transition-all"
          aria-label="Observatory settings"
          aria-expanded={open}
        >
          <Settings className="h-3.5 w-3.5 inline-block" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 w-[320px] border border-nex-light bg-nex-surface p-golden-2 shadow-lg">
            <div className="grid grid-cols-2 gap-golden-2">
              {/* Quality */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/50 block mb-1">Quality</span>
                <div className="flex flex-wrap gap-1">
                  {QUALITY_OPTIONS.map(({ value, label }) => (
                    <button key={value} onClick={() => updatePreference('quality', value)} className={`px-2 py-0.5 text-[10px] font-mono transition-all ${preferences.quality === value ? 'bg-cyan/20 text-cyan border border-cyan/40' : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-cyan/30 hover:text-white'}`}>{label}</button>
                  ))}
                </div>
              </div>
              {/* CVD Mode */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/50 block mb-1">Color Vision</span>
                <div className="flex flex-wrap gap-1">
                  {CVD_OPTIONS.map(({ value, label }) => (
                    <button key={value} onClick={() => updatePreference('cvdMode', value)} className={`px-2 py-0.5 text-[10px] font-mono transition-all ${preferences.cvdMode === value ? 'bg-violet/20 text-violet border border-violet/40' : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-violet/30 hover:text-white'}`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-nex-light bg-nex-surface p-golden-2">
      <div className="flex items-center justify-between mb-golden-2">
        <div className="flex items-center gap-golden-1">
          <Settings className="h-4 w-4 text-cyan" />
          <h3 className="text-sm font-semibold text-white">Preferences</h3>
          {isDetected && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-cyan/10 text-cyan/70 border border-cyan/20">
              auto-detected
            </span>
          )}
        </div>
        <button
          onClick={resetToDetected}
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-slate-dim/50 hover:text-cyan border border-nex-light hover:border-cyan/30 transition-all"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-golden-2">
        {/* Quality */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/50 block mb-1">
            Quality
          </label>
          <div className="flex flex-wrap gap-1">
            {QUALITY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updatePreference('quality', value)}
                className={`px-2 py-0.5 text-[10px] font-mono transition-all ${
                  preferences.quality === value
                    ? 'bg-cyan/20 text-cyan border border-cyan/40'
                    : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-cyan/30 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/50 block mb-1">
            Theme
          </label>
          <div className="flex flex-wrap gap-1">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updatePreference('theme', theme.id as ObservatoryThemeId)}
                className={`px-2 py-0.5 text-[10px] font-mono transition-all ${
                  preferences.theme === theme.id
                    ? 'bg-gold/20 text-gold border border-gold/40'
                    : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-gold/30 hover:text-white'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* CVD Mode — only shown when explorer supports it */}
        {showCvd && (
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/50 block mb-1">
              Color Vision
            </label>
            <div className="flex flex-wrap gap-1">
              {CVD_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updatePreference('cvdMode', value)}
                  className={`px-2 py-0.5 text-[10px] font-mono transition-all ${
                    preferences.cvdMode === value
                      ? 'bg-violet/20 text-violet border border-violet/40'
                      : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-violet/30 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Default Layout — only shown for ForceGraph3D explorers */}
        {showLayout && (
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/50 block mb-1">
              Layout
            </label>
            <div className="flex flex-wrap gap-1">
              {LAYOUT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updatePreference('defaultLayout', value)}
                  className={`px-2 py-0.5 text-[10px] font-mono transition-all ${
                    preferences.defaultLayout === value
                      ? 'bg-emerald/20 text-emerald border border-emerald/40'
                      : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-emerald/30 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Atmosphere — always shown */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-dim/50 block mb-1">
            Atmosphere
          </label>
          <div className="flex flex-wrap gap-1">
            {ATMOSPHERE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updatePreference('atmosphere', value)}
                className={`px-2 py-0.5 text-[10px] font-mono transition-all ${
                  preferences.atmosphere === value
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-nex-surface text-slate-dim/50 border border-nex-light hover:border-amber-500/30 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
