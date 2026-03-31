/**
 * Advanced Hooks - Phase 3
 *
 * Complex hooks for pagination, optimistic updates, infinite scroll,
 * and performance monitoring
 */

export { usePaginatedQuery } from './use-paginated-query';
export type { PaginatedQueryConfig, PaginatedQueryResult } from './use-paginated-query';

export { useOptimisticUpdate } from './use-optimistic-update';
export type { OptimisticUpdateConfig, OptimisticUpdateResult } from './use-optimistic-update';

export { useInfiniteScroll } from './use-infinite-scroll';
export type { InfiniteScrollConfig, InfiniteScrollResult } from './use-infinite-scroll';

export { useDebounce } from './use-debounce';

export { useMediaQuery, useBreakpoint, breakpoints } from './use-media-query';

export {
  useRenderPerformance,
  getComponentPerformanceEntries,
  clearComponentPerformanceEntries,
  getAverageRenderTime,
} from './use-render-performance';
export type { RenderPerformanceConfig, PerformanceData } from './use-render-performance';
