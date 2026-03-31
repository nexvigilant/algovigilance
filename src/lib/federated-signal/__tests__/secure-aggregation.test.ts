/**
 * Unit Tests - Secure Aggregation Service
 * Tests signal detection algorithms and aggregation logic
 */

import {
  SecureAggregationService,
  FederatedQueryBuilder,
  calculatePRR,
  calculateROR,
  calculateIC,
} from '../secure-aggregation';
import { classifySignalStrength } from '../signal-utils';

import type {
  ContingencyTableExtended,
  LocalStatistics,
  FederatedSignalQuery,
} from '../../../types/federated-signal';

// =============================================================================
// Signal Detection Algorithm Tests
// =============================================================================

describe('Signal Detection Algorithms', () => {
  describe('calculatePRR', () => {
    it('should calculate correct PRR for known values', () => {
      // Example: Drug A has 50 cases with Event X out of 150 drug cases
      // Background rate: 200 events out of 10000 total
      const table: ContingencyTableExtended = {
        a: 50,    // Drug + Event
        b: 100,   // Drug + No Event
        c: 150,   // No Drug + Event
        d: 9700,  // No Drug + No Event
        N: 10000,
        E: (150 * 200) / 10000, // Expected = 3
        drugTotal: 150,
        eventTotal: 200,
      };

      const result = calculatePRR(table);

      // PRR = (50/150) / (200/10000) = 0.333 / 0.02 = 16.67
      expect(result.value).toBeCloseTo(16.67, 1);
      expect(result.ci95Lower).toBeGreaterThan(0);
      expect(result.ci95Upper).toBeGreaterThan(result.value);
      expect(result.chiSquare).toBeGreaterThan(0);
    });

    it('should detect signal when criteria met', () => {
      const table: ContingencyTableExtended = {
        a: 20,
        b: 80,
        c: 100,
        d: 9800,
        N: 10000,
        E: 1.2,
        drugTotal: 100,
        eventTotal: 120,
      };

      const result = calculatePRR(table);

      // PRR should be high (20/100) / (120/10000) = 0.2 / 0.012 = 16.67
      expect(result.value).toBeGreaterThan(2.5);
      expect(result.isSignal).toBe(true);
      expect(result.strength).not.toBe('no_signal');
    });

    it('should not detect signal when PRR below threshold', () => {
      const table: ContingencyTableExtended = {
        a: 10,
        b: 90,
        c: 900,
        d: 9000,
        N: 10000,
        E: 9.1,
        drugTotal: 100,
        eventTotal: 910,
      };

      const result = calculatePRR(table);

      // PRR = (10/100) / (910/10000) = 0.1 / 0.091 = 1.1
      expect(result.value).toBeLessThan(2.5);
      expect(result.isSignal).toBe(false);
    });

    it('should handle zero cases gracefully', () => {
      const table: ContingencyTableExtended = {
        a: 0,
        b: 100,
        c: 100,
        d: 9800,
        N: 10000,
        E: 1,
        drugTotal: 100,
        eventTotal: 100,
      };

      const result = calculatePRR(table);

      expect(result.value).toBe(0);
      expect(result.isSignal).toBe(false);
      expect(result.strength).toBe('no_signal');
    });
  });

  describe('calculateROR', () => {
    it('should calculate correct ROR for known values', () => {
      const table: ContingencyTableExtended = {
        a: 50,
        b: 100,
        c: 150,
        d: 9700,
        N: 10000,
        E: 3,
        drugTotal: 150,
        eventTotal: 200,
      };

      const result = calculateROR(table);

      // ROR = (a*d)/(b*c) = (50*9700)/(100*150) = 485000/15000 = 32.33
      // With Haldane correction: (50.5*9700.5)/(100.5*150.5) ≈ 32.4
      expect(result.value).toBeCloseTo(32.4, 0);
      expect(result.ci95Lower).toBeGreaterThan(1);
      expect(result.ci95Upper).toBeGreaterThan(result.value);
    });

    it('should detect signal when CI lower bound exceeds 1.25', () => {
      const table: ContingencyTableExtended = {
        a: 30,
        b: 70,
        c: 100,
        d: 9800,
        N: 10000,
        E: 1,
        drugTotal: 100,
        eventTotal: 130,
      };

      const result = calculateROR(table);

      expect(result.ci95Lower).toBeGreaterThan(1.25);
      expect(result.isSignal).toBe(true);
    });

    it('should handle small cell counts with Haldane correction', () => {
      const table: ContingencyTableExtended = {
        a: 2,
        b: 0, // Zero cell
        c: 10,
        d: 9988,
        N: 10000,
        E: 0.024,
        drugTotal: 2,
        eventTotal: 12,
      };

      const result = calculateROR(table);

      // Should not throw, Haldane correction adds 0.5
      expect(result.value).toBeGreaterThan(0);
      expect(Number.isFinite(result.value)).toBe(true);
    });
  });

  describe('calculateIC', () => {
    it('should calculate correct IC for known values', () => {
      const table: ContingencyTableExtended = {
        a: 50,
        b: 100,
        c: 150,
        d: 9700,
        N: 10000,
        E: 3,
        drugTotal: 150,
        eventTotal: 200,
      };

      const result = calculateIC(table);

      // IC = log2((50 + 0.5)/(3 + 0.5)) = log2(50.5/3.5) = log2(14.43) ≈ 3.85
      expect(result.value).toBeCloseTo(3.85, 1);
      expect(result.ic025).toBeLessThan(result.value);
      expect(result.ic975).toBeGreaterThan(result.value);
    });

    it('should detect signal when IC025 exceeds 0.5', () => {
      const table: ContingencyTableExtended = {
        a: 30,
        b: 70,
        c: 100,
        d: 9800,
        N: 10000,
        E: 1.3,
        drugTotal: 100,
        eventTotal: 130,
      };

      const result = calculateIC(table);

      expect(result.ic025).toBeGreaterThan(0.5);
      expect(result.isSignal).toBe(true);
    });

    it('should handle zero expected gracefully', () => {
      const table: ContingencyTableExtended = {
        a: 0,
        b: 100,
        c: 0,
        d: 9900,
        N: 10000,
        E: 0,
        drugTotal: 100,
        eventTotal: 0,
      };

      const result = calculateIC(table);

      expect(result.isSignal).toBe(false);
      expect(result.strength).toBe('no_signal');
    });
  });

  describe('classifySignalStrength', () => {
    it('should return no_signal when isSignal is false', () => {
      expect(classifySignalStrength(15, false)).toBe('no_signal');
      expect(classifySignalStrength(3, false)).toBe('no_signal');
    });

    it('should classify very_strong for value >= 10', () => {
      expect(classifySignalStrength(10, true)).toBe('very_strong');
      expect(classifySignalStrength(15, true)).toBe('very_strong');
    });

    it('should classify strong for value 5-10', () => {
      expect(classifySignalStrength(5, true)).toBe('strong');
      expect(classifySignalStrength(7, true)).toBe('strong');
    });

    it('should classify moderate for value 3-5', () => {
      expect(classifySignalStrength(3, true)).toBe('moderate');
      expect(classifySignalStrength(4, true)).toBe('moderate');
    });

    it('should classify weak for value 2-3', () => {
      expect(classifySignalStrength(2, true)).toBe('weak');
      expect(classifySignalStrength(2.5, true)).toBe('weak');
    });

    it('should classify very_weak for value 1.5-2', () => {
      expect(classifySignalStrength(1.5, true)).toBe('very_weak');
      expect(classifySignalStrength(1.8, true)).toBe('very_weak');
    });
  });
});

// =============================================================================
// FederatedQueryBuilder Tests
// =============================================================================

describe('FederatedQueryBuilder', () => {
  it('should build a valid query', () => {
    const query = new FederatedQueryBuilder()
      .forDrug({ genericName: 'Warfarin', atcCode: 'B01AA03' })
      .forEvent({ ptTerm: 'Hemorrhage', meddraCode: '10017955' })
      .inTimeRange(new Date('2024-01-01'), new Date('2024-12-31'))
      .withMetrics('PRR', 'ROR')
      .withPrivacyBudget(0.5)
      .requestedBy('test-org')
      .build();

    expect(query.queryId).toBeTruthy();
    expect(query.drugCriteria.genericName).toBe('Warfarin');
    expect(query.eventCriteria.ptTerm).toBe('Hemorrhage');
    expect(query.privacyBudget).toBe(0.5);
    expect(query.requestedMetrics).toContain('PRR');
    expect(query.requestedMetrics).toContain('ROR');
  });

  it('should generate unique query IDs', () => {
    const query1 = new FederatedQueryBuilder()
      .forDrug({ genericName: 'Drug1' })
      .forEvent({ ptTerm: 'Event1' })
      .inTimeRange(new Date('2024-01-01'), new Date('2024-12-31'))
      .build();

    const query2 = new FederatedQueryBuilder()
      .forDrug({ genericName: 'Drug2' })
      .forEvent({ ptTerm: 'Event2' })
      .inTimeRange(new Date('2024-01-01'), new Date('2024-12-31'))
      .build();

    expect(query1.queryId).not.toBe(query2.queryId);
  });

  it('should throw when drug criteria missing', () => {
    expect(() => {
      new FederatedQueryBuilder()
        .forEvent({ ptTerm: 'Event' })
        .inTimeRange(new Date('2024-01-01'), new Date('2024-12-31'))
        .build();
    }).toThrow('Drug criteria required');
  });

  it('should throw when event criteria missing', () => {
    expect(() => {
      new FederatedQueryBuilder()
        .forDrug({ genericName: 'Drug' })
        .inTimeRange(new Date('2024-01-01'), new Date('2024-12-31'))
        .build();
    }).toThrow('Event criteria required');
  });

  it('should throw when time window missing', () => {
    expect(() => {
      new FederatedQueryBuilder()
        .forDrug({ genericName: 'Drug' })
        .forEvent({ ptTerm: 'Event' })
        .build();
    }).toThrow('Time window required');
  });

  it('should use default metrics when none specified', () => {
    const query = new FederatedQueryBuilder()
      .forDrug({ genericName: 'Drug' })
      .forEvent({ ptTerm: 'Event' })
      .inTimeRange(new Date('2024-01-01'), new Date('2024-12-31'))
      .build();

    expect(query.requestedMetrics).toContain('PRR');
    expect(query.requestedMetrics).toContain('ROR');
    expect(query.requestedMetrics).toContain('IC');
  });
});

// =============================================================================
// SecureAggregationService Tests
// =============================================================================

describe('SecureAggregationService', () => {
  let service: SecureAggregationService;

  beforeEach(() => {
    service = new SecureAggregationService({
      minParticipants: 3,
      minTotalCases: 5,
      collectionTimeoutMs: 60000,
      verifySignatures: false, // Disable for testing
    });
  });

  const createQuery = (): FederatedSignalQuery => ({
    queryId: `test-${Date.now()}`,
    drugCriteria: { genericName: 'Warfarin' },
    eventCriteria: { ptTerm: 'Hemorrhage' },
    timeWindow: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
    requestedMetrics: ['PRR', 'ROR', 'IC'],
    privacyBudget: 0.5,
    requesterId: 'test',
    requestedAt: new Date(),
  });

  const createContribution = (
    queryId: string,
    orgId: string,
    table: { a: number; b: number; c: number; d: number }
  ): LocalStatistics => ({
    queryId,
    organizationId: orgId,
    timestamp: new Date(),
    contingencyTable: table,
    metadata: {
      dataQuality: 'high',
      coveragePercentage: 95,
      noiseEpsilon: 0.5,
      computedAt: new Date(),
    },
    signature: 'test-signature',
    publicKey: 'test-public-key',
  });

  describe('initializeQuery', () => {
    it('should initialize query and return queryId', () => {
      const query = createQuery();
      const queryId = service.initializeQuery(query, 5);

      expect(queryId).toBe(query.queryId);

      const progress = service.getProgress(queryId);
      expect(progress).not.toBeNull();
      expect(progress?.status).toBe('pending');
      expect(progress?.participantsExpected).toBe(5);
    });
  });

  describe('submitContribution', () => {
    it('should accept valid contribution', async () => {
      const query = createQuery();
      service.initializeQuery(query, 3);

      const contribution = createContribution(query.queryId, 'org-1', {
        a: 10, b: 40, c: 50, d: 4900,
      });

      const progress = await service.submitContribution(contribution);

      expect(progress.participantsReceived).toBe(1);
      expect(progress.status).toBe('collecting');
    });

    it('should reject duplicate contribution from same org', async () => {
      const query = createQuery();
      service.initializeQuery(query, 3);

      const contribution = createContribution(query.queryId, 'org-1', {
        a: 10, b: 40, c: 50, d: 4900,
      });

      await service.submitContribution(contribution);
      const progress = await service.submitContribution(contribution);

      expect(progress.error).toContain('Duplicate');
    });

    it('should return error for unknown query', async () => {
      const contribution = createContribution('unknown-query', 'org-1', {
        a: 10, b: 40, c: 50, d: 4900,
      });

      const progress = await service.submitContribution(contribution);

      expect(progress.status).toBe('failed');
      expect(progress.error).toContain('not found');
    });

    it('should update status to aggregating when all participants received', async () => {
      const query = createQuery();
      service.initializeQuery(query, 2);

      await service.submitContribution(createContribution(query.queryId, 'org-1', {
        a: 10, b: 40, c: 50, d: 4900,
      }));

      const progress = await service.submitContribution(createContribution(query.queryId, 'org-2', {
        a: 15, b: 35, c: 60, d: 4890,
      }));

      expect(progress.status).toBe('aggregating');
    });
  });

  describe('computeResult', () => {
    it('should compute result when enough participants', async () => {
      const query = createQuery();
      service.initializeQuery(query, 3);

      // Submit 3 contributions
      await service.submitContribution(createContribution(query.queryId, 'org-1', {
        a: 20, b: 80, c: 100, d: 4800,
      }));
      await service.submitContribution(createContribution(query.queryId, 'org-2', {
        a: 15, b: 85, c: 90, d: 4810,
      }));
      await service.submitContribution(createContribution(query.queryId, 'org-3', {
        a: 25, b: 75, c: 110, d: 4790,
      }));

      const result = await service.computeResult(query.queryId);

      expect(result).not.toBeNull();
      expect(result?.participantCount).toBe(3);
      expect(result?.globalContingency.a).toBe(60); // 20 + 15 + 25
      expect(result?.globalContingency.b).toBe(240); // 80 + 85 + 75
      expect(result?.signals.prr).toBeDefined();
      expect(result?.signals.ror).toBeDefined();
      expect(result?.signals.ic).toBeDefined();
    });

    it('should return null when insufficient participants', async () => {
      const query = createQuery();
      service.initializeQuery(query, 3);

      await service.submitContribution(createContribution(query.queryId, 'org-1', {
        a: 10, b: 40, c: 50, d: 4900,
      }));

      const result = await service.computeResult(query.queryId);

      expect(result).toBeNull();

      const progress = service.getProgress(query.queryId);
      expect(progress?.status).toBe('insufficient_participants');
    });

    it('should return null for unknown query', async () => {
      const result = await service.computeResult('unknown-query');
      expect(result).toBeNull();
    });

    it('should include privacy guarantee in result', async () => {
      const query = createQuery();
      service.initializeQuery(query, 3);

      await service.submitContribution(createContribution(query.queryId, 'org-1', {
        a: 20, b: 80, c: 100, d: 4800,
      }));
      await service.submitContribution(createContribution(query.queryId, 'org-2', {
        a: 15, b: 85, c: 90, d: 4810,
      }));
      await service.submitContribution(createContribution(query.queryId, 'org-3', {
        a: 25, b: 75, c: 110, d: 4790,
      }));

      const result = await service.computeResult(query.queryId);

      expect(result?.privacyGuarantee).toBeDefined();
      expect(result?.privacyGuarantee.kAnonymitySatisfied).toBe(true);
      expect(result?.privacyGuarantee.participantMinimum).toBe(3);
    });
  });

  describe('cleanupExpired', () => {
    it('should remove expired pending aggregations', async () => {
      // Create service with very short timeout
      const shortTimeoutService = new SecureAggregationService({
        minParticipants: 3,
        minTotalCases: 5,
        collectionTimeoutMs: 1, // 1ms timeout
        verifySignatures: false,
      });

      const query = createQuery();
      shortTimeoutService.initializeQuery(query, 3);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 10));

      const cleaned = shortTimeoutService.cleanupExpired();
      expect(cleaned).toBe(1);

      const progress = shortTimeoutService.getProgress(query.queryId);
      expect(progress).toBeNull();
    });
  });

  describe('closeQuery', () => {
    it('should remove query from pending', () => {
      const query = createQuery();
      service.initializeQuery(query, 3);

      service.closeQuery(query.queryId);

      const progress = service.getProgress(query.queryId);
      expect(progress).toBeNull();
    });
  });
});
