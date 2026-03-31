/**
 * PRISMA Flow Diagram Generation
 *
 * Generates text and JSON representations of PRISMA 2020 flow diagrams.
 * Uses the official PRISMA 2020 template structure.
 */

import type { PRISMAFlowDiagram } from './types';

// =============================================================================
// Flow Diagram Text Generation
// =============================================================================

/**
 * Generate a text-based PRISMA 2020 flow diagram
 *
 * Matches the official PRISMA 2020 template structure
 *
 * @param flowDiagram - The flow diagram data
 * @returns Formatted string representation
 */
export function generateFlowDiagramText(flowDiagram: PRISMAFlowDiagram): string {
  const { identification, screening, eligibility, included } = flowDiagram;

  // Convert exclusion reasons map to sorted array
  const exclusionReasons = Array.from(eligibility.reportsExcluded.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `    - ${reason}: ${count}`)
    .join('\n');

  return `
╔════════════════════════════════════════════════════════════════════════════════╗
║                          PRISMA 2020 Flow Diagram                              ║
║                         Generated: ${flowDiagram.generatedAt.toISOString().split('T')[0]}                           ║
╠════════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                           IDENTIFICATION                                 │  ║
║  ├─────────────────────────────────────────────────────────────────────────┤  ║
║  │  Records from databases (n=${identification.databases.toString().padStart(5)})                                │  ║
║  │  Records from registers (n=${identification.registers.toString().padStart(5)})                                │  ║
║  │  Records from other methods (n=${identification.otherMethods.toString().padStart(5)})                            │  ║
║  │                                                                         │  ║
║  │  Duplicates removed (n=${identification.duplicatesRemoved.toString().padStart(5)})                                    │  ║
║  │  Records removed (automation) (n=${identification.automationExcluded.toString().padStart(5)})                        │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                      │                                         ║
║                                      ▼                                         ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                             SCREENING                                    │  ║
║  ├─────────────────────────────────────────────────────────────────────────┤  ║
║  │  Records screened (n=${screening.recordsScreened.toString().padStart(5)})                                       │  ║
║  │  Records excluded (n=${screening.recordsExcluded.toString().padStart(5)})                                       │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                      │                                         ║
║                                      ▼                                         ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                            ELIGIBILITY                                   │  ║
║  ├─────────────────────────────────────────────────────────────────────────┤  ║
║  │  Reports sought for retrieval (n=${eligibility.reportsSought.toString().padStart(5)})                            │  ║
║  │  Reports not retrieved (n=${eligibility.reportsNotRetrieved.toString().padStart(5)})                                 │  ║
║  │  Reports assessed for eligibility (n=${eligibility.reportsAssessed.toString().padStart(5)})                      │  ║
║  │                                                                         │  ║
║  │  Reports excluded (n=${eligibility.reportsExcluded.size.toString().padStart(5)} reasons):                            │  ║
${exclusionReasons || '    (none)'}
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                      │                                         ║
║                                      ▼                                         ║
║  ┌─────────────────────────────────────────────────────────────────────────┐  ║
║  │                             INCLUDED                                     │  ║
║  ├─────────────────────────────────────────────────────────────────────────┤  ║
║  │  Studies included in review (n=${included.studies.toString().padStart(5)})                                │  ║
║  │  Studies in meta-analysis (n=${included.inMetaAnalysis !== null ? included.inMetaAnalysis.toString().padStart(5) : '  N/A'})                                │  ║
║  └─────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
`;
}

// =============================================================================
// Flow Diagram JSON Generation
// =============================================================================

/**
 * Generate PRISMA flow diagram as JSON (for programmatic use)
 *
 * @param flowDiagram - The flow diagram data
 * @returns JSON-serializable object
 */
export function generateFlowDiagramJSON(
  flowDiagram: PRISMAFlowDiagram
): Record<string, unknown> {
  return {
    ...flowDiagram,
    eligibility: {
      ...flowDiagram.eligibility,
      reportsExcluded: Object.fromEntries(flowDiagram.eligibility.reportsExcluded),
    },
    generatedAt: flowDiagram.generatedAt.toISOString(),
  };
}
