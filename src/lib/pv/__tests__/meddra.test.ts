/**
 * Tests for MedDRA Hierarchy Navigator
 *
 * MedDRA (Medical Dictionary for Regulatory Activities) is the
 * standard medical terminology for adverse event classification.
 *
 * Hierarchy Structure (5 levels):
 * - SOC (System Organ Class) - highest level, 27 classes
 * - HLGT (High Level Group Term)
 * - HLT (High Level Term)
 * - PT (Preferred Term) - primary coding level
 * - LLT (Lowest Level Term) - most specific, maps to PT
 *
 * Based on ICH E2B(R3) E.i.2.1 guidance and OpenRIMS TerminologyMedDRA patterns.
 */

import {
  // Constants
  MEDDRA_LEVELS,
  MEDDRA_LEVEL_ORDER,
  // Factory Functions
  createMedDRATerm,
  createMedDRAHierarchy,
  // Validation
  isValidMedDRACode,
  validateMedDRAHierarchy,
  // Utilities
  getMedDRALevelLabel,
  getMedDRALevelE2BCode,
  getParentLevel,
  getChildLevel,
  isAncestorOf,
} from '../meddra';

describe('MedDRA Level Constants', () => {
  it('should define all 5 MedDRA levels', () => {
    expect(MEDDRA_LEVELS.SOC).toBe('soc');
    expect(MEDDRA_LEVELS.HLGT).toBe('hlgt');
    expect(MEDDRA_LEVELS.HLT).toBe('hlt');
    expect(MEDDRA_LEVELS.PT).toBe('pt');
    expect(MEDDRA_LEVELS.LLT).toBe('llt');
  });

  it('should have correct level order (highest to lowest)', () => {
    expect(MEDDRA_LEVEL_ORDER).toEqual(['soc', 'hlgt', 'hlt', 'pt', 'llt']);
  });
});

describe('MedDRA Level Utilities', () => {
  describe('getMedDRALevelLabel', () => {
    it('should return human-readable labels', () => {
      expect(getMedDRALevelLabel('soc')).toBe('System Organ Class');
      expect(getMedDRALevelLabel('hlgt')).toBe('High Level Group Term');
      expect(getMedDRALevelLabel('hlt')).toBe('High Level Term');
      expect(getMedDRALevelLabel('pt')).toBe('Preferred Term');
      expect(getMedDRALevelLabel('llt')).toBe('Lowest Level Term');
    });
  });

  describe('getMedDRALevelE2BCode', () => {
    it('should return E2B element codes', () => {
      expect(getMedDRALevelE2BCode('llt')).toBe('E.i.2.1b');
      expect(getMedDRALevelE2BCode('pt')).toBe('E.i.2.1a');
    });
  });

  describe('getParentLevel', () => {
    it('should return parent level', () => {
      expect(getParentLevel('llt')).toBe('pt');
      expect(getParentLevel('pt')).toBe('hlt');
      expect(getParentLevel('hlt')).toBe('hlgt');
      expect(getParentLevel('hlgt')).toBe('soc');
    });

    it('should return undefined for SOC (no parent)', () => {
      expect(getParentLevel('soc')).toBeUndefined();
    });
  });

  describe('getChildLevel', () => {
    it('should return child level', () => {
      expect(getChildLevel('soc')).toBe('hlgt');
      expect(getChildLevel('hlgt')).toBe('hlt');
      expect(getChildLevel('hlt')).toBe('pt');
      expect(getChildLevel('pt')).toBe('llt');
    });

    it('should return undefined for LLT (no children)', () => {
      expect(getChildLevel('llt')).toBeUndefined();
    });
  });
});

describe('MedDRA Code Validation', () => {
  describe('isValidMedDRACode', () => {
    it('should accept valid 8-digit codes', () => {
      expect(isValidMedDRACode('10019211')).toBe(true);
      expect(isValidMedDRACode('10000001')).toBe(true);
      expect(isValidMedDRACode('99999999')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(isValidMedDRACode('1234567')).toBe(false); // Too short
      expect(isValidMedDRACode('123456789')).toBe(false); // Too long
      expect(isValidMedDRACode('1234567A')).toBe(false); // Contains letter
      expect(isValidMedDRACode('')).toBe(false); // Empty
    });

    it('should accept codes with leading zeros', () => {
      expect(isValidMedDRACode('00000001')).toBe(true);
    });
  });
});

describe('createMedDRATerm', () => {
  it('should create a MedDRA term with required fields', () => {
    const term = createMedDRATerm({
      code: '10019211',
      term: 'Headache',
      level: 'pt',
    });

    expect(term.code).toBe('10019211');
    expect(term.term).toBe('Headache');
    expect(term.level).toBe('pt');
    expect(term.isActive).toBe(true);
  });

  it('should include parent code when provided', () => {
    const term = createMedDRATerm({
      code: '10019211',
      term: 'Headache',
      level: 'llt',
      parentCode: '10019211', // PT code
    });

    expect(term.parentCode).toBe('10019211');
  });

  it('should allow marking term as inactive', () => {
    const term = createMedDRATerm({
      code: '10000001',
      term: 'Deprecated term',
      level: 'llt',
      isActive: false,
    });

    expect(term.isActive).toBe(false);
  });

  it('should include SOC code for classification', () => {
    const term = createMedDRATerm({
      code: '10019211',
      term: 'Headache',
      level: 'pt',
      socCode: '10029205', // Nervous system disorders
    });

    expect(term.socCode).toBe('10029205');
  });
});

describe('createMedDRAHierarchy', () => {
  it('should create a complete hierarchy from LLT to SOC', () => {
    const hierarchy = createMedDRAHierarchy({
      llt: { code: '10019211', term: 'Headache' },
      pt: { code: '10019211', term: 'Headache' },
      hlt: { code: '10019231', term: 'Headaches' },
      hlgt: { code: '10019233', term: 'Headaches NEC' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    expect(hierarchy.llt.code).toBe('10019211');
    expect(hierarchy.pt.code).toBe('10019211');
    expect(hierarchy.hlt.code).toBe('10019231');
    expect(hierarchy.hlgt.code).toBe('10019233');
    expect(hierarchy.soc.code).toBe('10029205');
  });

  it('should work with PT only (minimal E2B requirement)', () => {
    const hierarchy = createMedDRAHierarchy({
      pt: { code: '10019211', term: 'Headache' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    expect(hierarchy.pt.code).toBe('10019211');
    expect(hierarchy.soc.code).toBe('10029205');
    expect(hierarchy.llt).toBeUndefined();
    expect(hierarchy.hlt).toBeUndefined();
    expect(hierarchy.hlgt).toBeUndefined();
  });

  it('should calculate depth based on levels present', () => {
    const fullHierarchy = createMedDRAHierarchy({
      llt: { code: '10019211', term: 'Headache' },
      pt: { code: '10019211', term: 'Headache' },
      hlt: { code: '10019231', term: 'Headaches' },
      hlgt: { code: '10019233', term: 'Headaches NEC' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    const minimalHierarchy = createMedDRAHierarchy({
      pt: { code: '10019211', term: 'Headache' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    expect(fullHierarchy.depth).toBe(5);
    expect(minimalHierarchy.depth).toBe(2);
  });
});

describe('validateMedDRAHierarchy', () => {
  it('should validate a complete hierarchy', () => {
    const hierarchy = createMedDRAHierarchy({
      llt: { code: '10019211', term: 'Headache' },
      pt: { code: '10019211', term: 'Headache' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    const validation = validateMedDRAHierarchy(hierarchy);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('should require SOC for valid hierarchy', () => {
    const hierarchy = {
      pt: { code: '10019211', term: 'Headache', level: 'pt' as const, isActive: true },
      depth: 1,
    };

    const validation = validateMedDRAHierarchy(hierarchy);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('SOC is required for valid hierarchy');
  });

  it('should require PT for valid hierarchy', () => {
    const hierarchy = {
      soc: { code: '10029205', term: 'Nervous system disorders', level: 'soc' as const, isActive: true },
      depth: 1,
    };

    const validation = validateMedDRAHierarchy(hierarchy);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('PT is required for valid hierarchy');
  });

  it('should validate code format at each level', () => {
    const hierarchy = createMedDRAHierarchy({
      pt: { code: 'INVALID', term: 'Headache' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    const validation = validateMedDRAHierarchy(hierarchy);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Invalid MedDRA code at PT level');
  });
});

describe('isAncestorOf', () => {
  it('should correctly identify ancestor levels', () => {
    expect(isAncestorOf('soc', 'pt')).toBe(true);
    expect(isAncestorOf('soc', 'llt')).toBe(true);
    expect(isAncestorOf('hlt', 'pt')).toBe(true);
    expect(isAncestorOf('pt', 'llt')).toBe(true);
  });

  it('should return false for non-ancestor levels', () => {
    expect(isAncestorOf('llt', 'pt')).toBe(false);
    expect(isAncestorOf('pt', 'soc')).toBe(false);
    expect(isAncestorOf('hlt', 'hlgt')).toBe(false);
  });

  it('should return false for same level', () => {
    expect(isAncestorOf('pt', 'pt')).toBe(false);
    expect(isAncestorOf('soc', 'soc')).toBe(false);
  });
});

describe('MedDRA Integration with E2B', () => {
  it('should support E2B reaction coding fields', () => {
    // E.i.2.1a - Reaction (MedDRA PT)
    // E.i.2.1b - Reaction (MedDRA LLT)
    const hierarchy = createMedDRAHierarchy({
      llt: { code: '10019211', term: 'Headache' },
      pt: { code: '10019211', term: 'Headache' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    // These fields map directly to E2B
    expect(hierarchy.pt.code).toBeDefined(); // E.i.2.1a
    expect(hierarchy.pt.term).toBeDefined(); // E.i.2.1a text
    expect(hierarchy.llt?.code).toBeDefined(); // E.i.2.1b
    expect(hierarchy.llt?.term).toBeDefined(); // E.i.2.1b text
  });

  it('should support primary SOC classification', () => {
    // E.i.3.1 - Term highlighted by reporter (Y/N)
    // Primary SOC determines the main classification
    const hierarchy = createMedDRAHierarchy({
      pt: { code: '10019211', term: 'Headache' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    expect(hierarchy.soc.code).toBe('10029205');
    expect(hierarchy.soc.term).toBe('Nervous system disorders');
  });
});

describe('MedDRA Version Handling', () => {
  it('should track MedDRA version in hierarchy', () => {
    const hierarchy = createMedDRAHierarchy({
      pt: { code: '10019211', term: 'Headache' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
      version: '27.0',
    });

    expect(hierarchy.version).toBe('27.0');
  });

  it('should default to undefined if version not specified', () => {
    const hierarchy = createMedDRAHierarchy({
      pt: { code: '10019211', term: 'Headache' },
      soc: { code: '10029205', term: 'Nervous system disorders' },
    });

    expect(hierarchy.version).toBeUndefined();
  });
});
