'use client'

/**
 * Glow Shader Material — HDR-aware rim lighting with bloom interaction.
 *
 * Section 2.3 of the Observatory 3D Rendering Architecture.
 *
 * - Dual-layer rim: tight inner core + wide outer halo
 * - HDR emissive output exceeds bloom threshold (0.8) for selective pickup
 * - Dual-frequency pulse for organic animation
 * - Fresnel-aware alpha falloff for soft edges
 */

import type React from 'react'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, GLOW } from './observatory-constants'

const GlowShaderMaterial = shaderMaterial(
  {
    color: new THREE.Color(COLORS.cyan),
    intensity: GLOW.defaultIntensity,
    time: 0,
  },
  /* vertex */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform vec3 color;
    uniform float intensity;
    uniform float time;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 viewDir = normalize(-vPosition);
      float rim = 1.0 - max(0.0, dot(vNormal, viewDir));

      // Dual-layer rim: tight inner core + wide outer halo
      float innerRim = pow(rim, ${(GLOW.rimPower + 1.0).toFixed(1)}) * 1.5;
      float outerRim = pow(rim, ${(GLOW.rimPower * 0.6).toFixed(1)}) * 0.6;
      float combinedRim = innerRim + outerRim;

      // Dual-frequency pulse — organic breathing
      float slowPulse = sin(time * ${GLOW.pulseSpeed.toFixed(1)}) * 0.5 + 0.5;
      float fastPulse = sin(time * ${(GLOW.pulseSpeed * 2.7).toFixed(1)}) * 0.5 + 0.5;
      float pulse = 1.0 + ${GLOW.pulseAmplitude.toFixed(2)} * mix(slowPulse, fastPulse, 0.3);

      // HDR emissive — output exceeds bloom threshold for selective glow
      float glow = combinedRim * intensity * pulse;
      vec3 hdrColor = color * glow;

      // Fresnel-aware alpha — soft edges, solid core rim
      float alpha = combinedRim * ${GLOW.alphaMultiplier.toFixed(1)} * pulse;
      alpha = clamp(alpha, 0.0, 1.0);

      gl_FragColor = vec4(hdrColor, alpha);
    }
  `
)

extend({ GlowShaderMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    glowShaderMaterial: React.JSX.IntrinsicElements['shaderMaterial'] & {
      color?: THREE.Color | string
      intensity?: number
      time?: number
    }
  }
}

export { GlowShaderMaterial }
