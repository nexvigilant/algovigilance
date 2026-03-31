"use client";

/**
 * Observatory Post-Processing Stack — Cinematic rendering for perceptual purpose.
 *
 * Section 2.5 of the Observatory 3D Rendering Architecture.
 *
 * - Bloom: Pre-attentive luminance pop-out for strong signals (HDR selective — threshold 0.8)
 * - SSAO: Contact shadows for depth/proximity Gestalt grouping
 * - DepthOfField: Background softening for foveal attention
 * - ChromaticAberration: Subtle lens physicality
 * - Vignette: Foveal attention focusing
 */

import { useMemo } from "react";
import {
  EffectComposer,
  Bloom,
  SSAO,
  Vignette,
  DepthOfField,
  ChromaticAberration,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { POST_PROCESSING } from "./observatory-constants";

interface ObservatoryPostProcessingProps {
  enableBloom?: boolean;
  enableSSAO?: boolean;
  enableVignette?: boolean;
  enableDoF?: boolean;
  enableChromaticAberration?: boolean;
  /** SSAO sample count — maps to quality preset ssaoSamples */
  ssaoSamples?: number;
}

export function ObservatoryPostProcessing({
  enableBloom = true,
  enableSSAO = true,
  enableVignette = true,
  enableDoF = true,
  enableChromaticAberration = true,
  ssaoSamples = POST_PROCESSING.ssaoSamples,
}: ObservatoryPostProcessingProps) {
  const ssaoColor = useMemo(
    () => new THREE.Color(POST_PROCESSING.ssaoColor),
    [],
  );
  const caOffset = useMemo(
    () =>
      new THREE.Vector2(
        enableChromaticAberration
          ? POST_PROCESSING.chromaticAberrationOffset
          : 0,
        enableChromaticAberration
          ? POST_PROCESSING.chromaticAberrationOffset
          : 0,
      ),
    [enableChromaticAberration],
  );

  return (
    <EffectComposer multisampling={0} enableNormalPass={enableSSAO}>
      <Bloom
        intensity={enableBloom ? POST_PROCESSING.bloomIntensity : 0}
        luminanceThreshold={POST_PROCESSING.bloomThreshold}
        luminanceSmoothing={POST_PROCESSING.bloomSmoothing}
        mipmapBlur
      />
      <SSAO
        samples={ssaoSamples}
        radius={POST_PROCESSING.ssaoRadius}
        intensity={enableSSAO ? POST_PROCESSING.ssaoIntensity : 0}
        color={ssaoColor}
      />
      <DepthOfField
        focusDistance={POST_PROCESSING.dofFocusDistance}
        focalLength={POST_PROCESSING.dofFocalLength}
        bokehScale={enableDoF ? POST_PROCESSING.dofBokehScale : 0}
      />
      <ChromaticAberration offset={caOffset} />
      <Vignette
        offset={POST_PROCESSING.vignetteOffset}
        darkness={enableVignette ? POST_PROCESSING.vignetteDarkness : 0}
      />
    </EffectComposer>
  );
}
