'use client'

/**
 * CVD Geometry — Color Vision Deficiency support via shape encoding.
 *
 * Section 6.1 of the Observatory 3D Rendering Architecture.
 *
 * When color alone is insufficient (CVD users), node type is
 * redundantly encoded in geometry:
 *   drug → Sphere
 *   event → Box
 *   signal → Octahedron
 *   cluster → Torus
 */

import { useState, useEffect } from 'react'
import * as THREE from 'three'
import type { CVDMode } from '@/lib/observatory/types'
import { GEOMETRY } from './observatory-constants'

export type DataType = 'drug' | 'event' | 'signal' | 'cluster'

const GEOMETRY_MAP: Record<DataType, () => THREE.BufferGeometry> = {
  drug: () => new THREE.SphereGeometry(1, ...GEOMETRY.sphereDetail),
  event: () => new THREE.BoxGeometry(1.6, 1.6, 1.6),
  signal: () => new THREE.OctahedronGeometry(1.2),
  cluster: () => new THREE.TorusGeometry(1, 0.3, 12, 24),
}

// ─── Geometry Cache ─────────────────────────────────────────────────────────

const GEOMETRY_CACHE = new Map<string, THREE.BufferGeometry>()

function getCachedGeometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = GEOMETRY_CACHE.get(key)
  if (!geo) {
    geo = factory()
    GEOMETRY_CACHE.set(key, geo)
  }
  return geo
}

/**
 * Get shape-encoded geometry based on data type and CVD mode.
 *
 * In 'normal' mode, returns sphere for all types (color differentiates).
 * In CVD modes, returns type-specific geometry for redundant encoding.
 * Geometries are cached — created once, reused on subsequent calls.
 */
export function getNodeGeometry(dataType: DataType, cvdMode: CVDMode): THREE.BufferGeometry {
  if (cvdMode === 'normal') {
    return getCachedGeometry('sphere', () => new THREE.SphereGeometry(1, ...GEOMETRY.sphereDetail))
  }
  return getCachedGeometry(dataType, () => GEOMETRY_MAP[dataType]())
}

// ─── useCVDMode Hook ─────────────────────────────────────────────────────────

const CVD_STORAGE_KEY = 'observatory-cvd-mode'

/**
 * Reads and persists CVD mode preference from localStorage.
 */
export function useCVDMode(): [CVDMode, (mode: CVDMode) => void] {
  const [mode, setMode] = useState<CVDMode>('normal')

  useEffect(() => {
    const stored = localStorage.getItem(CVD_STORAGE_KEY)
    if (stored && isValidCVDMode(stored)) {
      setMode(stored)
    }
  }, [])

  const updateMode = (newMode: CVDMode) => {
    setMode(newMode)
    localStorage.setItem(CVD_STORAGE_KEY, newMode)
  }

  return [mode, updateMode]
}

function isValidCVDMode(value: string): value is CVDMode {
  return ['normal', 'deuteranopia', 'protanopia', 'tritanopia'].includes(value)
}

// ─── Geometry Labels (for legend/UI) ─────────────────────────────────────────

export const CVD_GEOMETRY_LABELS: Record<DataType, string> = {
  drug: 'Sphere (Drug)',
  event: 'Cube (Event)',
  signal: 'Octahedron (Signal)',
  cluster: 'Torus (Cluster)',
}
