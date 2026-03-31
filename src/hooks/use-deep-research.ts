'use client';

/**
 * Deep Research Hook
 *
 * React hook for executing autonomous research tasks using
 * Google's Gemini Deep Research Agent.
 *
 * @example
 * ```tsx
 * function ResearchPanel() {
 *   const { research, isLoading, result, error } = useDeepResearch();
 *
 *   const handleResearch = async () => {
 *     await research('Analyze GLP-1 agonist safety signals');
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleResearch} disabled={isLoading}>
 *         {isLoading ? 'Researching...' : 'Start Research'}
 *       </button>
 *       {result && <div>{result.report}</div>}
 *       {error && <div className="text-red-500">{error}</div>}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useTransition } from 'react';
import {
  executeDeepResearch,
  executePVResearch,
  researchDrugSafety,
  researchRegulatoryLandscape,
  askFollowUp,
  type DeepResearchActionResult,
} from '@/app/actions/deep-research';
import type { PVResearchRequest } from '@/lib/deep-research';

// =============================================================================
// Types
// =============================================================================

export interface UseDeepResearchResult {
  /** Execute a general research query */
  research: (query: string) => Promise<DeepResearchActionResult>;
  /** Execute PV-specific research */
  pvResearch: (request: PVResearchRequest) => Promise<DeepResearchActionResult>;
  /** Research drug safety profile */
  drugSafety: (drugName: string, adverseEvents?: string[]) => Promise<DeepResearchActionResult>;
  /** Research regulatory landscape */
  regulatoryLandscape: (therapeuticArea: string, regions?: string[]) => Promise<DeepResearchActionResult>;
  /** Ask follow-up question */
  followUp: (interactionId: string, question: string) => Promise<string | null>;
  /** Whether research is in progress */
  isLoading: boolean;
  /** The latest research result */
  result: DeepResearchActionResult | null;
  /** Error message if research failed */
  error: string | null;
  /** Clear the current result and error */
  reset: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useDeepResearch(): UseDeepResearchResult {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<DeepResearchActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const research = useCallback(async (query: string): Promise<DeepResearchActionResult> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        setError(null);
        try {
          const response = await executeDeepResearch(query);
          setResult(response);
          if (!response.success) {
            setError(response.error ?? 'Research failed');
          }
          resolve(response);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMsg);
          const errorResult: DeepResearchActionResult = { success: false, error: errorMsg };
          setResult(errorResult);
          resolve(errorResult);
        }
      });
    });
  }, []);

  const pvResearch = useCallback(async (request: PVResearchRequest): Promise<DeepResearchActionResult> => {
    return new Promise((resolve) => {
      startTransition(async () => {
        setError(null);
        try {
          const response = await executePVResearch(request);
          setResult(response);
          if (!response.success) {
            setError(response.error ?? 'PV research failed');
          }
          resolve(response);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMsg);
          const errorResult: DeepResearchActionResult = { success: false, error: errorMsg };
          setResult(errorResult);
          resolve(errorResult);
        }
      });
    });
  }, []);

  const drugSafety = useCallback(
    async (drugName: string, adverseEvents?: string[]): Promise<DeepResearchActionResult> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const response = await researchDrugSafety(drugName, adverseEvents);
            setResult(response);
            if (!response.success) {
              setError(response.error ?? 'Drug safety research failed');
            }
            resolve(response);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);
            const errorResult: DeepResearchActionResult = { success: false, error: errorMsg };
            setResult(errorResult);
            resolve(errorResult);
          }
        });
      });
    },
    []
  );

  const regulatoryLandscape = useCallback(
    async (therapeuticArea: string, regions?: string[]): Promise<DeepResearchActionResult> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          setError(null);
          try {
            const response = await researchRegulatoryLandscape(therapeuticArea, regions);
            setResult(response);
            if (!response.success) {
              setError(response.error ?? 'Regulatory landscape research failed');
            }
            resolve(response);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);
            const errorResult: DeepResearchActionResult = { success: false, error: errorMsg };
            setResult(errorResult);
            resolve(errorResult);
          }
        });
      });
    },
    []
  );

  const followUp = useCallback(
    async (interactionId: string, question: string): Promise<string | null> => {
      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const response = await askFollowUp(interactionId, question);
            if (response.success && response.answer) {
              resolve(response.answer);
            } else {
              setError(response.error ?? 'Follow-up failed');
              resolve(null);
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);
            resolve(null);
          }
        });
      });
    },
    []
  );

  return {
    research,
    pvResearch,
    drugSafety,
    regulatoryLandscape,
    followUp,
    isLoading: isPending,
    result,
    error,
    reset,
  };
}

export default useDeepResearch;
