/**
 * Shared NexCore configuration — safe for both server and client contexts.
 */

export const NEXCORE_API_URL =
  process.env.NEXCORE_API_URL ||
  process.env.NEXT_PUBLIC_NEXCORE_API_URL ||
  'http://localhost:3030';
