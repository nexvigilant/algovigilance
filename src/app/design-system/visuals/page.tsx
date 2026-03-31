'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  SPHERE_PRESET_NUCLEUS,
  SPHERE_PRESET_OBSERVATORY,
  SPHERE_PRESET_CLINICAL,
  SPHERE_PRESET_WAR_ROOM,
  SPHERE_PRESET_SIGNAL,
  type ShaderSphereConfig,
} from '@/components/ui/branded/shader-sphere';
import {
  AtmosphereLayers,
  ATMOSPHERE_NUCLEUS,
  ATMOSPHERE_DEEP_SPACE,
  ATMOSPHERE_CLINICAL,
  ATMOSPHERE_WAR_ROOM,
} from '@/components/ui/branded/atmosphere-layers';

const ShaderSphere = dynamic(
  () => import('@/components/ui/branded/shader-sphere').then(m => ({ default: m.ShaderSphere })),
  { ssr: false, loading: () => <div className="h-[160px] w-[160px] rounded-full bg-nex-dark/50 animate-pulse" /> }
);

const SPHERE_PRESETS: Array<{ name: string; config: ShaderSphereConfig; description: string }> = [
  { name: 'Nucleus', config: { ...SPHERE_PRESET_NUCLEUS, size: [128, 160] }, description: 'Gold/cyan — the original hub eye' },
  { name: 'Observatory', config: { ...SPHERE_PRESET_OBSERVATORY, size: [128, 160] }, description: 'Deep blue-violet — cosmic exploration' },
  { name: 'Clinical', config: { ...SPHERE_PRESET_CLINICAL, size: [128, 160] }, description: 'Off-white — sterile, medical precision' },
  { name: 'War Room', config: { ...SPHERE_PRESET_WAR_ROOM, size: [128, 160] }, description: 'Red-shifted — alert state, intense focus' },
  { name: 'Signal', config: { ...SPHERE_PRESET_SIGNAL, size: [128, 160] }, description: 'Emerald — steady monitoring, signal detection' },
];

const ATMOSPHERE_PRESETS = [
  { name: 'Nucleus', config: ATMOSPHERE_NUCLEUS },
  { name: 'Deep Space', config: ATMOSPHERE_DEEP_SPACE },
  { name: 'Clinical', config: ATMOSPHERE_CLINICAL },
  { name: 'War Room', config: ATMOSPHERE_WAR_ROOM },
];

export default function VisualsShowcasePage() {
  const [activeAtmosphere, setActiveAtmosphere] = useState(0);
  const atm = ATMOSPHERE_PRESETS[activeAtmosphere];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan/60 mb-1">
          Design System
        </p>
        <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight mb-2">
          Visual Templates
        </h1>
        <p className="text-sm text-slate-dim/70 max-w-xl">
          Reusable 3D shader spheres, atmosphere layers, and circuit board backgrounds.
          Each preset is parameterizable — colors, noise, displacement, animation speed, rings.
        </p>
      </header>

      {/* Shader Sphere Gallery */}
      <section className="mb-12">
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-dim/50 mb-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-nex-light" />
          Shader Sphere Presets
          <span className="h-px flex-1 bg-nex-light" />
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {SPHERE_PRESETS.map((preset) => (
            <div key={preset.name} className="flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center h-[180px] w-[180px] border border-nex-light bg-nex-deep overflow-hidden">
                <ShaderSphere config={preset.config} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">{preset.name}</p>
                <p className="text-[10px] text-slate-dim/60 mt-0.5">{preset.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Config Reference */}
      <section className="mb-12">
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-dim/50 mb-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-nex-light" />
          Sphere Config Parameters
          <span className="h-px flex-1 bg-nex-light" />
        </h2>
        <div className="border border-nex-light bg-nex-surface overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-nex-light">
                <th className="text-left px-3 py-2 font-mono text-slate-dim/60">Param</th>
                {SPHERE_PRESETS.map(p => (
                  <th key={p.name} className="text-center px-3 py-2 font-mono text-white">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-slate-dim/80">
              <tr className="border-b border-nex-light/50">
                <td className="px-3 py-1.5">noiseScale</td>
                {SPHERE_PRESETS.map(p => <td key={p.name} className="text-center px-3 py-1.5">{p.config.noiseScale}</td>)}
              </tr>
              <tr className="border-b border-nex-light/50">
                <td className="px-3 py-1.5">displacement</td>
                {SPHERE_PRESETS.map(p => <td key={p.name} className="text-center px-3 py-1.5">{p.config.displacementAmplitude}</td>)}
              </tr>
              <tr className="border-b border-nex-light/50">
                <td className="px-3 py-1.5">animationSpeed</td>
                {SPHERE_PRESETS.map(p => <td key={p.name} className="text-center px-3 py-1.5">{p.config.animationSpeed}</td>)}
              </tr>
              <tr className="border-b border-nex-light/50">
                <td className="px-3 py-1.5">fresnelPower</td>
                {SPHERE_PRESETS.map(p => <td key={p.name} className="text-center px-3 py-1.5">{p.config.fresnelPower}</td>)}
              </tr>
              <tr className="border-b border-nex-light/50">
                <td className="px-3 py-1.5">rings</td>
                {SPHERE_PRESETS.map(p => <td key={p.name} className="text-center px-3 py-1.5">{p.config.rings.length}</td>)}
              </tr>
              <tr>
                <td className="px-3 py-1.5">subdivisions</td>
                {SPHERE_PRESETS.map(p => <td key={p.name} className="text-center px-3 py-1.5">{p.config.subdivisions}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Atmosphere Preview */}
      <section className="mb-12">
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-dim/50 mb-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-nex-light" />
          Atmosphere Presets
          <span className="h-px flex-1 bg-nex-light" />
        </h2>
        <div className="flex gap-2 mb-4">
          {ATMOSPHERE_PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => setActiveAtmosphere(i)}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                i === activeAtmosphere
                  ? 'border-cyan/60 bg-cyan/10 text-cyan'
                  : 'border-nex-light bg-nex-surface text-slate-dim/60 hover:text-white'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="relative h-[300px] border border-nex-light bg-nex-deep overflow-hidden">
          <AtmosphereLayers config={atm.config} />
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <p className="text-lg font-headline font-bold text-white/80">{atm.name}</p>
          </div>
        </div>
      </section>

      {/* Usage */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-dim/50 mb-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-nex-light" />
          Usage
          <span className="h-px flex-1 bg-nex-light" />
        </h2>
        <div className="border border-nex-light bg-nex-surface p-4">
          <pre className="text-[11px] font-mono text-cyan/80 whitespace-pre-wrap">{`import { ShaderSphere, SPHERE_PRESET_OBSERVATORY } from '@/components/ui/branded';
import { AtmosphereLayers, ATMOSPHERE_DEEP_SPACE } from '@/components/ui/branded';
import { CircuitBackground, CIRCUIT_PRESET_NUCLEUS } from '@/components/ui/branded';
import { useOrbitalLayout } from '@/hooks/use-orbital-layout';

<div className="relative h-screen bg-nex-deep">
  <AtmosphereLayers config={ATMOSPHERE_DEEP_SPACE} />
  <CircuitBackground config={CIRCUIT_PRESET_NUCLEUS} activeTraceId={hovered} />
  <ShaderSphere config={SPHERE_PRESET_OBSERVATORY} />
</div>`}</pre>
        </div>
      </section>
    </div>
  );
}
