/**
 * MCP Response Parser for Measured<T> values.
 *
 * NexCore MCP tools that produce Measured<T> output emit:
 *   { "value": <number>, "confidence": <0.0-1.0> }
 *
 * This module provides typed parsing with null-safe extraction.
 *
 * Grounding: ∂(Boundary) — parsing is a boundary operation (external → internal)
 */

import type { Measured } from './measured'

/**
 * Parse a single Measured<T> from an MCP response object.
 *
 * Returns null if the response does not match the Measured<T> shape.
 * Callers must handle the null case (unknown/malformed response).
 */
export function parseMeasuredResponse<T>(response: unknown): Measured<T> | null {
  if (
    response !== null &&
    typeof response === 'object' &&
    'value' in response &&
    'confidence' in response
  ) {
    const r = response as Record<string, unknown>
    const confidence = Number(r.confidence)
    if (Number.isFinite(confidence)) {
      return {
        value: r.value as T,
        confidence: Math.max(0, Math.min(1, confidence)),
      }
    }
  }
  return null
}

/**
 * Parse an array of Measured<number> from an MCP response array.
 *
 * Filters out entries that don't match the Measured<T> shape.
 */
export function parseMeasuredArray(
  response: unknown[],
): Measured<number>[] {
  const results: Measured<number>[] = []
  for (const item of response) {
    const parsed = parseMeasuredResponse<number>(item)
    if (parsed !== null) {
      results.push(parsed)
    }
  }
  return results
}

/**
 * Extract a Measured<number> from a nested MCP response.
 *
 * Handles common MCP response shapes:
 *   { result: { value, confidence } }
 *   { data: { value, confidence } }
 *   { value, confidence }
 */
export function extractMeasured(response: unknown): Measured<number> | null {
  // Direct shape
  const direct = parseMeasuredResponse<number>(response)
  if (direct !== null) return direct

  // Nested under result or data
  if (response !== null && typeof response === 'object') {
    const r = response as Record<string, unknown>
    if (r.result) {
      const nested = parseMeasuredResponse<number>(r.result)
      if (nested !== null) return nested
    }
    if (r.data) {
      const nested = parseMeasuredResponse<number>(r.data)
      if (nested !== null) return nested
    }
  }

  return null
}
