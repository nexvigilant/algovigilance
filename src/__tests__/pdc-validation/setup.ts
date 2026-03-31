/**
 * PDC Validation Test Setup
 *
 * Configures the test environment for validator unit tests.
 * These tests run in Node.js (no JSDOM required) since validators
 * are pure data transformation functions.
 */

// Increase timeout for async validators that may process large datasets
jest.setTimeout(10000);

// Mock console methods for cleaner test output
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Global test utilities
export const createEmptyPDCData = () => ({
  epas: [],
  cpas: [],
  domains: [],
  epaDomainMappings: [],
  cpaEpaMappings: [],
  cpaDomainMappings: [],
  ksbs: [],
  activityAnchors: [],
  metadata: {
    version: '4.1',
    exportedAt: new Date().toISOString(),
  },
});
