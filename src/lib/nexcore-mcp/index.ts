/**
 * NexCore MCP SDK — Barrel re-exports.
 *
 * Import from '@/lib/nexcore-mcp' to access any domain.
 *
 * @example
 *   import { pv, faers, chemistry, viz } from '@/lib/nexcore-mcp'
 *   const result = await pv.signalComplete({ a: 10, b: 5, c: 3, d: 100 })
 */

// Core transport (generic mcpCall for ad-hoc usage)
export { mcpCall, call } from "./core";
export type {
  NexcoreError,
  McpToolResponse,
  McpCallOptions,
  SignalInput,
} from "./core";

// Pharmacovigilance
export {
  pv,
  pvAxioms,
  pvEmbeddings,
  pvdsl,
  faers,
  signal,
  vigilance,
} from "./pv";
export type { SignalResult, FaersSearchParams } from "./pv";

// Science & computation
export {
  chemistry,
  chem,
  stem,
  epi,
  molecular,
  molecularWeight,
  kellnr,
  pharmaRd,
  polymer,
  stoichiometry,
} from "./science";

// Regulatory & compliance
export {
  regulatory,
  fdaCredibility,
  fhir,
  mesh,
  compliance,
  security,
} from "./regulatory";

// Observatory & visualization
export {
  viz,
  topology,
  observatory,
  cloud,
  drift,
  observability,
} from "./observatory";

// Foundation & compute
export {
  foundation,
  editDistance,
  combinatorics,
  wolfram,
  aggregate,
  rankFusion,
  lexPrimitiva,
  tovGrounded,
  nmd,
  compendious,
  zeta,
  valueMining,
  measure,
  visual,
} from "./compute";
