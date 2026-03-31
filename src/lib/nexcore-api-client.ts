'use client';

/**
 * NexCore API Client — Client-Side with Circuit Breaker
 *
 * Wraps the server-safe nexcore-api with client-only CircuitBreaker protection.
 * Only import this from 'use client' components — never from server actions.
 */

import { CircuitBreaker, CircuitBreakerOpenError } from '@/hooks/use-circuit-breaker';

/**
 * Circuit breaker for the NexCore Rust backend.
 * Opens after 5 failures in 60s, cools down for 30s.
 */
const nexcoreBreaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 30_000,
  failureWindowMs: 60_000,
});

export { nexcoreBreaker, CircuitBreakerOpenError };
