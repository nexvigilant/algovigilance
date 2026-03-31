/**
 * Community Types
 *
 * Re-exports all community types from the modular structure.
 * This file maintains backward compatibility - existing imports
 * from '@/types/community' will continue to work.
 *
 * @deprecated Import directly from '@/types/community' (the folder) for better tree-shaking.
 *
 * @module types/community
 */

// Re-export everything from the community module
export * from './community/index';
