'use client'

/**
 * Uncertainty Material — Custom GLSL shader for confidence-modulated rendering.
 *
 * Section 3.1 of the Observatory 3D Rendering Architecture.
 *
 * - Fresnel rim lighting for 3D depth perception
 * - Noise-based dissolution for low-confidence nodes
 * - Alpha modulated by confidence (0.3 → 1.0)
 * - Emissive glow for signal strength (emerging signals glow)
 */

import type React from 'react'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS } from './observatory-constants'

const UncertaintyShaderMaterial = shaderMaterial(
  {
    baseColor: new THREE.Color(COLORS.cyan),
    confidence: 1.0,
    signalStrength: 0.0,
    emissiveColor: new THREE.Color(COLORS.goldBright),
    time: 0,
  },
  /* vertex */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPos;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform vec3 baseColor;
    uniform float confidence;
    uniform float signalStrength;
    uniform vec3 emissiveColor;
    uniform float time;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPos;

    // Simple hash for dissolution noise
    float hash(vec3 p) {
      p = fract(p * vec3(443.897, 441.423, 437.195));
      p += dot(p, p.yzx + 19.19);
      return fract((p.x + p.y) * p.z);
    }

    void main() {
      // Fresnel rim lighting — edge emphasis for 3D depth perception
      float rim = 1.0 - max(0.0, dot(vNormal, normalize(-vPosition)));
      float fresnel = pow(rim, 2.5);

      // Dissolution for low-confidence nodes
      float dissolveThreshold = 1.0 - confidence;
      float noise = hash(vWorldPos * 10.0);
      if (noise < dissolveThreshold * 0.7) discard;

      // Confidence-modulated alpha (0.3 → 1.0)
      float alpha = 0.3 + confidence * 0.7;

      // Emissive glow for strong signals
      vec3 emissive = emissiveColor * signalStrength * (0.8 + 0.2 * sin(time * 2.0));

      // Combine
      vec3 color = baseColor + fresnel * 0.3 + emissive;

      gl_FragColor = vec4(color, alpha);
    }
  `,
)

extend({ UncertaintyShaderMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    uncertaintyShaderMaterial: React.JSX.IntrinsicElements['shaderMaterial'] & {
      baseColor?: THREE.Color | string
      confidence?: number
      signalStrength?: number
      emissiveColor?: THREE.Color | string
      time?: number
    }
  }
}

export { UncertaintyShaderMaterial }
