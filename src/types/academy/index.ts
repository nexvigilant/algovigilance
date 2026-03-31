// ============================================================================
// Academy Types — Barrel Re-export
// ============================================================================
// All types previously in academy.ts are now split across domain files.
// This barrel preserves the `@/types/academy` import path.

export * from './ids';
export * from './serialization';
export * from './content';
export * from './core';
export * from './learning';
export * from './engagement';
export * from './portfolio';
export * from './deprecated';
