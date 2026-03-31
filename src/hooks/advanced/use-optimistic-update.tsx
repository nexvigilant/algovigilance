'use client';

import { useState, useCallback, useRef } from 'react';

export interface OptimisticUpdateConfig<TData, TVariables> {
  /** Function to perform the mutation on the server */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /** Function to optimistically update the UI immediately */
  onOptimisticUpdate: (variables: TVariables) => void;

  /** Callback when mutation succeeds */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /** Callback when mutation fails (before rollback) */
  onError?: (error: Error, variables: TVariables) => void;

  /** Function to rollback optimistic update on error */
  onRollback?: () => void;

  /** Retry failed mutations (default: false) */
  retry?: boolean;

  /** Number of retry attempts (default: 3) */
  retryAttempts?: number;

  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
}

export interface OptimisticUpdateResult<TData, TVariables> {
  /** Trigger the optimistic update */
  mutate: (variables: TVariables) => Promise<void>;

  /** Whether a mutation is currently in progress */
  isLoading: boolean;

  /** Whether the UI is showing optimistic data */
  isOptimistic: boolean;

  /** Error from the last failed mutation */
  error: Error | null;

  /** Data from the last successful mutation */
  data: TData | null;

  /** Reset error state */
  reset: () => void;
}

/**
 * Hook for optimistic UI updates with automatic rollback on error
 *
 * @example
 * ```tsx
 * const { mutate, isOptimistic } = useOptimisticUpdate({
 *   mutationFn: async (newPost) => await createPost(newPost),
 *   onOptimisticUpdate: (newPost) => {
 *     // Add post to UI immediately
 *     setPosts(prev => [newPost, ...prev]);
 *   },
 *   onSuccess: (createdPost) => {
 *     // Replace optimistic post with real one
 *     setPosts(prev => prev.map(p =>
 *       p.id === newPost.id ? createdPost : p
 *     ));
 *   },
 *   onRollback: () => {
 *     // Remove optimistic post on error
 *     setPosts(prev => prev.filter(p => p.id !== newPost.id));
 *   }
 * });
 * ```
 */
export function useOptimisticUpdate<TData, TVariables>({
  mutationFn,
  onOptimisticUpdate,
  onSuccess,
  onError,
  onRollback,
  retry = false,
  retryAttempts = 3,
  retryDelay = 1000,
}: OptimisticUpdateConfig<TData, TVariables>): OptimisticUpdateResult<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  // Track pending mutations
  const pendingMutations = useRef(0);

  const executeMutation = useCallback(
    async (variables: TVariables, attempt: number = 1): Promise<void> => {
      try {
        const result = await mutationFn(variables);

        // Decrement pending counter
        pendingMutations.current -= 1;

        // Update state with server response
        setData(result);
        setError(null);

        // Only clear loading states when ALL mutations are complete
        if (pendingMutations.current === 0) {
          setIsLoading(false);
          setIsOptimistic(false);
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(result, variables);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed');

        // Check if we should retry
        if (retry && attempt < retryAttempts) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          // Retry the mutation
          return executeMutation(variables, attempt + 1);
        }

        // Decrement pending counter (only on final failure, not during retry)
        pendingMutations.current -= 1;

        // Call error callback
        if (onError) {
          onError(error, variables);
        }

        // Rollback optimistic update
        if (onRollback) {
          onRollback();
        }

        setError(error);

        // Only clear loading states when ALL mutations are complete
        if (pendingMutations.current === 0) {
          setIsLoading(false);
          setIsOptimistic(false);
        }
      }
    },
    [mutationFn, onSuccess, onError, onRollback, retry, retryAttempts, retryDelay]
  );

  const mutate = useCallback(
    async (variables: TVariables) => {
      // Increment pending mutations counter
      pendingMutations.current += 1;

      // Apply optimistic update immediately
      setIsLoading(true);
      setIsOptimistic(true);
      setError(null);

      onOptimisticUpdate(variables);

      // Execute the actual mutation
      await executeMutation(variables);
    },
    [onOptimisticUpdate, executeMutation]
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    isLoading,
    isOptimistic,
    error,
    data,
    reset,
  };
}
