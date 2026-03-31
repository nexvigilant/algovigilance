'use client'

/**
 * Safe Environment — intentionally removed drei Environment dependency.
 *
 * drei's Environment fetches HDRI files from raw.githack.com, an external CDN
 * blocked by our CSP. The Observatory scene already has a full lighting rig
 * (ambient + hemisphere + 3 point lights + stars + sparkles), making IBL
 * reflections unnecessary for data visualization.
 *
 * This component is kept as a no-op to preserve the call site contract in
 * scene-container.tsx without requiring a multi-file refactor.
 */
export function SafeEnvironment(_props: { preset?: string }) {
  return null
}
