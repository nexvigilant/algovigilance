'use client';

import { ShaderSphere, SPHERE_PRESET_NUCLEUS } from '@/components/ui/branded/shader-sphere';

interface NucleusSphereProps {
  className?: string;
}

/**
 * The Nucleus hub center eye — gold/cyan shader sphere.
 * Thin wrapper around ShaderSphere with the NUCLEUS preset.
 */
export function NucleusSphere({ className }: NucleusSphereProps) {
  return <ShaderSphere config={SPHERE_PRESET_NUCLEUS} className={className} />;
}
