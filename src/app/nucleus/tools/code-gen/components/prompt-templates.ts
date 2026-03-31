import {
  Shield,
  Gauge,
  Database,
  GitBranch,
  Filter,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface PromptTemplate {
  id: string;
  label: string;
  icon: LucideIcon;
  prompt: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'rate-limiter',
    label: 'Rate Limiter',
    icon: Gauge,
    prompt:
      'A rate limiter struct using Frequency (v) + Boundary (d) + State (s) primitives. Track requests per key with a sliding window. Include check() that returns Result<(), RateLimitError>.',
  },
  {
    id: 'state-machine',
    label: 'State Machine',
    icon: Workflow,
    prompt:
      'A typestate state machine using State (s) + Causality (->) + Boundary (d) primitives. Define states as zero-sized types with compile-time transition enforcement. Include 3 states: Pending, Active, Complete.',
  },
  {
    id: 'validator',
    label: 'Input Validator',
    icon: Shield,
    prompt:
      'A validation pipeline using Boundary (d) + Comparison (k) + Sequence (o) primitives. Chain multiple validation rules that produce typed errors. Include email, length, and pattern validators.',
  },
  {
    id: 'cache',
    label: 'LRU Cache',
    icon: Database,
    prompt:
      'An LRU cache using Mapping (u) + Persistence (p) + Boundary (d) + Quantity (N) primitives. Fixed capacity with O(1) get/put. Include TTL-based expiration via Irreversibility (a).',
  },
  {
    id: 'pipeline',
    label: 'Transform Pipeline',
    icon: Filter,
    prompt:
      'A composable data pipeline using Sequence (o) + Mapping (u) + Boundary (d) primitives. Chain transform steps with error boundaries. Each step is a Fn(T) -> Result<U, E>.',
  },
  {
    id: 'event-bus',
    label: 'Event Bus',
    icon: GitBranch,
    prompt:
      'An event bus using Causality (->) + Sum (S) + Mapping (u) primitives. Type-safe event emission and subscription. Include async handler support and unsubscribe tokens.',
  },
];
