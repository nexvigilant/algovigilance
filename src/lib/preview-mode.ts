/**
 * Preview Mode — centralized flag for open-access demo previews.
 *
 * NEXT_PUBLIC_ vars are inlined at build time by Next.js.
 * Import this constant instead of checking process.env directly.
 *
 * To enable: set NEXT_PUBLIC_PREVIEW_MODE=true (client) and PREVIEW_MODE=true (server/Edge)
 */
export const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true';
