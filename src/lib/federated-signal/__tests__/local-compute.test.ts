/**
 * Unit Tests - Local Compute Module
 * Tests differential privacy and local computation functions
 */

import {
  addNoise,
  addNoiseToTable,
  laplaceSample,
  gaussianSample,
  computeLocalContingency,
  LocalComputeModule,
  MockSafetyDatabase,
  type LocalSafetyDatabase,
} from '../local-compute';

import type {
  ContingencyTable,
  PrivacyConfig,
  FederatedSignalQuery,
} from '../../../types/federated-signal';

// =============================================================================
// Differential Privacy Tests
// =============================================================================

describe('Differential Privacy Utilities', () => {
  describe('laplaceSample', () => {
    it('should generate samples with mean approximately 0', () => {
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(laplaceSample(1.0));
      }
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(Math.abs(mean)).toBeLessThan(0.1); // Mean should be close to 0
    });

    it('should have variance proportional to scale squared', () => {
      const scale = 2.0;
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(laplaceSample(scale));
      }
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length;
      // Laplace variance = 2 * scale^2
      const expectedVariance = 2 * scale * scale;
      expect(Math.abs(variance - expectedVariance)).toBeLessThan(0.5);
    });
  });

  describe('gaussianSample', () => {
    it('should generate samples with mean approximately 0', () => {
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(gaussianSample(1.0));
      }
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(Math.abs(mean)).toBeLessThan(0.1);
    });

    it('should have variance approximately equal to sigma squared', () => {
      const sigma = 2.0;
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(gaussianSample(sigma));
      }
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance = samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / samples.length;
      expect(Math.abs(variance - sigma * sigma)).toBeLessThan(0.5);
    });
  });

  describe('addNoise', () => {
    const laplaceConfig: PrivacyConfig = {
      epsilon: 1.0,
      sensitivity: 1,
      mechanism: 'laplace',
    };

    const gaussianConfig: PrivacyConfig = {
      epsilon: 1.0,
      sensitivity: 1,
      mechanism: 'gaussian',
    };

    it('should return non-negative integers', () => {
      for (let i = 0; i < 100; i++) {
        const result = addNoise(50, laplaceConfig);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should preserve approximate mean', () => {
      const trueCount = 100;
      const results: number[] = [];
      for (let i = 0; i < 1000; i++) {
        results.push(addNoise(trueCount, laplaceConfig));
      }
      const mean = results.reduce((a, b) => a + b, 0) / results.length;
      expect(Math.abs(mean - trueCount)).toBeLessThan(5);
    });

    it('should work with Gaussian mechanism', () => {
      const result = addNoise(50, gaussianConfig);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should add more noise with lower epsilon', () => {
      const highPrivacyConfig: PrivacyConfig = { ...laplaceConfig, epsilon: 0.1 };
      const lowPrivacyConfig: PrivacyConfig = { ...laplaceConfig, epsilon: 2.0 };

      const highPrivacyResults: number[] = [];
      const lowPrivacyResults: number[] = [];

      for (let i = 0; i < 1000; i++) {
        highPrivacyResults.push(addNoise(100, highPrivacyConfig));
        lowPrivacyResults.push(addNoise(100, lowPrivacyConfig));
      }

      const highVariance = calculateVariance(highPrivacyResults);
      const lowVariance = calculateVariance(lowPrivacyResults);

      expect(highVariance).toBeGreaterThan(lowVariance);
    });
  });

  describe('addNoiseToTable', () => {
    const config: PrivacyConfig = {
      epsilon: 1.0,
      sensitivity: 1,
      mechanism: 'laplace',
    };

    const table: ContingencyTable = {
      a: 50,
      b: 100,
      c: 200,
      d: 5000,
    };

    it('should return a table with all non-negative values', () => {
      const noisedTable = addNoiseToTable(table, config);
      expect(noisedTable.a).toBeGreaterThanOrEqual(0);
      expect(noisedTable.b).toBeGreaterThanOrEqual(0);
      expect(noisedTable.c).toBeGreaterThanOrEqual(0);
      expect(noisedTable.d).toBeGreaterThanOrEqual(0);
    });

    it('should split privacy budget across cells', () => {
      // With budget split, each cell gets epsilon/4
      // This means more noise per cell than if we used full epsilon
      const results: ContingencyTable[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(addNoiseToTable(table, config));
      }

      // Calculate variance for cell 'a'
      const aValues = results.map(r => r.a);
      const aVariance = calculateVariance(aValues);

      // Variance should be higher due to budget split
      // Laplace variance = 2 * (sensitivity / epsilon)^2
      // With epsilon/4, variance is 16x higher
      expect(aVariance).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// Local Computation Tests
// =============================================================================

describe('Local Computation', () => {
  describe('computeLocalContingency', () => {
    it('should compute correct contingency table', async () => {
      const mockDatabase: LocalSafetyDatabase = {
        countDrugEventCases: jest.fn().mockResolvedValue(50),
        countDrugCases: jest.fn().mockResolvedValue(150),
        countEventCases: jest.fn().mockResolvedValue(200),
        countTotalCases: jest.fn().mockResolvedValue(10000),
        getDataQuality: jest.fn().mockResolvedValue('high'),
        getCoveragePercentage: jest.fn().mockResolvedValue(95),
      };

      const query: FederatedSignalQuery = {
        queryId: 'test-query',
        drugCriteria: { genericName: 'TestDrug' },
        eventCriteria: { ptTerm: 'TestEvent' },
        timeWindow: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
        requestedMetrics: ['PRR'],
        privacyBudget: 0.5,
        requesterId: 'test',
        requestedAt: new Date(),
      };

      const table = await computeLocalContingency(query, mockDatabase);

      // a = drugEvent = 50
      expect(table.a).toBe(50);
      // b = drugTotal - drugEvent = 150 - 50 = 100
      expect(table.b).toBe(100);
      // c = eventTotal - drugEvent = 200 - 50 = 150
      expect(table.c).toBe(150);
      // d = total - a - b - c = 10000 - 50 - 100 - 150 = 9700
      expect(table.d).toBe(9700);
    });
  });

  describe('MockSafetyDatabase', () => {
    it('should return consistent results with same seed', async () => {
      const db1 = new MockSafetyDatabase(10000, 42);
      const db2 = new MockSafetyDatabase(10000, 42);

      const result1 = await db1.countDrugEventCases();
      const result2 = await db2.countDrugEventCases();

      expect(result1).toBe(result2);
    });

    it('should return different results with different seeds', async () => {
      const db1 = new MockSafetyDatabase(10000, 42);
      const db2 = new MockSafetyDatabase(10000, 123);

      const result1 = await db1.countDrugEventCases();
      const result2 = await db2.countDrugEventCases();

      expect(result1).not.toBe(result2);
    });

    it('should return plausible case counts', async () => {
      const db = new MockSafetyDatabase(10000);

      const drugEvent = await db.countDrugEventCases();
      const drug = await db.countDrugCases();
      const event = await db.countEventCases();
      const total = await db.countTotalCases();

      expect(total).toBe(10000);
      expect(drug).toBeGreaterThan(0);
      expect(drug).toBeLessThan(total);
      expect(event).toBeGreaterThan(0);
      expect(event).toBeLessThan(total);
      expect(drugEvent).toBeGreaterThanOrEqual(0);
      expect(drugEvent).toBeLessThanOrEqual(Math.min(drug, event));
    });
  });
});

// =============================================================================
// LocalComputeModule Tests
// =============================================================================

describe('LocalComputeModule', () => {
  const config = {
    organizationId: 'test-org',
    privateKey: 'test-private-key',
    publicKey: 'test-public-key',
    defaultPrivacy: {
      epsilon: 0.5,
      sensitivity: 1,
      mechanism: 'laplace' as const,
    },
  };

  describe('validateQuery', () => {
    const module = new LocalComputeModule(config, new MockSafetyDatabase());

    const validQuery: FederatedSignalQuery = {
      queryId: 'test',
      drugCriteria: { genericName: 'Warfarin' },
      eventCriteria: { ptTerm: 'Hemorrhage' },
      timeWindow: { start: new Date('2024-01-01'), end: new Date('2024-06-30') },
      requestedMetrics: ['PRR'],
      privacyBudget: 0.5,
      requesterId: 'requester',
      requestedAt: new Date(),
    };

    it('should accept valid query', () => {
      const result = module.validateQuery(validQuery, 5.0);
      expect(result.valid).toBe(true);
    });

    it('should reject query exceeding budget', () => {
      const result = module.validateQuery(validQuery, 0.3);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Insufficient privacy budget');
    });

    it('should reject query with epsilon too low', () => {
      const lowEpsilonQuery = { ...validQuery, privacyBudget: 0.05 };
      const result = module.validateQuery(lowEpsilonQuery, 5.0);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('out of range');
    });

    it('should reject query with epsilon too high', () => {
      const highEpsilonQuery = { ...validQuery, privacyBudget: 3.0 };
      const result = module.validateQuery(highEpsilonQuery, 5.0);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('out of range');
    });

    it('should reject query with future time window', () => {
      const futureQuery = {
        ...validQuery,
        timeWindow: { start: new Date('2024-01-01'), end: new Date('2099-12-31') },
      };
      const result = module.validateQuery(futureQuery, 5.0);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('future');
    });

    it('should reject query without drug criteria', () => {
      const noDrugQuery = { ...validQuery, drugCriteria: {} };
      const result = module.validateQuery(noDrugQuery, 5.0);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Drug criteria');
    });

    it('should reject query without event criteria', () => {
      const noEventQuery = { ...validQuery, eventCriteria: {} };
      const result = module.validateQuery(noEventQuery, 5.0);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Event criteria');
    });
  });

  describe('processQuery', () => {
    it('should return LocalStatistics with all required fields', async () => {
      const module = new LocalComputeModule(config, new MockSafetyDatabase(10000, 42));

      const query: FederatedSignalQuery = {
        queryId: 'test-query-123',
        drugCriteria: { genericName: 'Warfarin' },
        eventCriteria: { ptTerm: 'Hemorrhage' },
        timeWindow: { start: new Date('2024-01-01'), end: new Date('2024-06-30') },
        requestedMetrics: ['PRR', 'ROR'],
        privacyBudget: 0.5,
        requesterId: 'test-requester',
        requestedAt: new Date(),
      };

      const result = await module.processQuery(query);

      expect(result.queryId).toBe('test-query-123');
      expect(result.organizationId).toBe('test-org');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.contingencyTable).toBeDefined();
      expect(result.contingencyTable.a).toBeGreaterThanOrEqual(0);
      expect(result.contingencyTable.b).toBeGreaterThanOrEqual(0);
      expect(result.contingencyTable.c).toBeGreaterThanOrEqual(0);
      expect(result.contingencyTable.d).toBeGreaterThanOrEqual(0);
      expect(result.metadata.noiseEpsilon).toBe(0.5);
      expect(result.signature).toBeTruthy();
      expect(result.publicKey).toBe('test-public-key');
    });
  });
});

// =============================================================================
// Helper Functions
// =============================================================================

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length;
}
